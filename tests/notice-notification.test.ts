import assert from 'node:assert/strict'
import { createHash, createHmac, randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import webpush from 'web-push'
import handler from '../api/notice-notification.ts'
import pollHandler from '../api/notice-notification-poll.ts'
import { fetchNotices, noticeConfig, noticeTime, openSubscriber, pollNotices, RedisNoticeStore, sealSubscriber, sendNotice, subscriberId } from '../server/noticePush.ts'
import type { Notice, NoticeStore, PollState, Subscriber } from '../server/noticePush.ts'

const origin = 'https://yufesta.example'
const keys = webpush.generateVAPIDKeys()
const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: { auth: randomBytes(16).toString('base64url'), p256dh: Buffer.concat([Buffer.from([4]), randomBytes(64)]).toString('base64url') } }
const env = { NOTICE_PUSH_ENABLED: 'true', NOTICE_API_ORIGIN: 'https://api.yufesta.example', PUSH_PUBLIC_ORIGIN: origin,
  UPSTASH_REDIS_REST_URL: 'https://redis.example', UPSTASH_REDIS_REST_TOKEN: 'test-redis', VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey,
  QSTASH_CURRENT_SIGNING_KEY: 'test-signing-key', QSTASH_NEXT_SIGNING_KEY: 'next-test-signing-key' }
const originals = Object.fromEntries(Object.keys(env).map(name => [name, process.env[name]]))
const originalFetch = globalThis.fetch
const since = Date.parse('2026-10-02T01:00:00Z')
const oldNotice: Notice = { id: 100, title: '기존 공지', body: '기존 안내', createdAt: '2026-10-02T09:00:00' }
const freshNotice: Notice = { id: 101, title: '새 공지', body: '인스타팅 이외 공지도 전달', createdAt: '2026-10-02T10:01:00' }

class MemoryStore implements NoticeStore {
  value: PollState | null = null
  members: Record<string, string> = {}
  sent = new Map<number, Set<string>>()
  owner: string | null = null
  reads = 0
  async initialize(notices: Notice[]) { this.value ??= { seen: notices.map(notice => notice.id), pending: [] } }
  async state() { return structuredClone(this.value) }
  async save(state: PollState, owner: string) { assert.equal(owner, this.owner); this.value = structuredClone(state) }
  async acquire(owner: string) { if (this.owner) return false; this.owner = owner; return true }
  async release(owner: string) { if (owner === this.owner) this.owner = null }
  async subscribers() { this.reads++; return { ...this.members } }
  async get(id: string) { return this.members[id] ?? null }
  async add(id: string, value: string) { this.members[id] ??= value }
  async remove(id: string, expected: string) { if (this.members[id] === expected) delete this.members[id] }
  async acknowledged(id: number) { return new Set(this.sent.get(id)) }
  async acknowledge(id: number, member: string) { if (!this.sent.has(id)) this.sent.set(id, new Set()); this.sent.get(id)!.add(member) }
}
function member(store: MemoryStore, id = 'one', overrides: Partial<Subscriber> = {}) {
  const value: Subscriber = { subscription, since, baseline: [100], version: id, ...overrides }
  store.members[id] = sealSubscriber(value, keys.privateKey)
}
function request(action = 'subscribe', value: unknown = subscription, requestOrigin = origin) {
  return new Request(`${origin}/api/notice-notification`, { method: 'POST', headers: { Origin: requestOrigin, 'Content-Type': 'application/json' }, body: JSON.stringify({ action, subscription: value }) })
}
function sign(body: string, url: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iss: 'Upstash', sub: url, nbf: 0, exp: Math.floor(Date.now() / 1000) + 600, body: createHash('sha256').update(body).digest('base64url') })).toString('base64url')
  return `${header}.${payload}.${createHmac('sha256', env.QSTASH_CURRENT_SIGNING_KEY).update(`${header}.${payload}`).digest('base64url')}`
}

describe('새 공지 푸시', { concurrency: false }, () => {
  beforeEach(() => { Object.assign(process.env, env); globalThis.fetch = (async () => { throw new Error('Unexpected network request') }) as typeof fetch })
  afterEach(() => {
    globalThis.fetch = originalFetch
    for (const [name, value] of Object.entries(originals)) { if (value === undefined) delete process.env[name]; else process.env[name] = value }
  })

  test('구독 정보는 암호화되며 변조·다른 키로 복호화할 수 없다', () => {
    const value = { subscription, since, baseline: [100], version: 'one' }
    const sealed = sealSubscriber(value, keys.privateKey)
    assert.ok(!sealed.includes(subscription.endpoint))
    assert.deepEqual(openSubscriber(sealed, keys.privateKey), value)
    assert.throws(() => openSubscriber(sealed, 'wrong-key'))
    assert.throws(() => openSubscriber(`${sealed.slice(0, 20)}AAAA${sealed.slice(24)}`, keys.privateKey))
  })
  test('처음 확인한 공지들은 발송하지 않고 기준으로 저장한다', async () => {
    const store = new MemoryStore()
    const result = await pollNotices(noticeConfig(), store, { fetchNotices: async () => [oldNotice], sendNotice: async () => assert.fail('Historical notice'), now: () => since })
    assert.deepEqual(result, { initialized: true, sent: 0 })
    assert.deepEqual(store.value?.seen, [100])
  })
  test('공지 변화가 없으면 구독자 수와 관계없이 저장된 구독 목록을 읽지 않는다', async () => {
    const store = new MemoryStore(); await store.initialize([oldNotice]); member(store)
    await pollNotices(noticeConfig(), store, { fetchNotices: async () => [oldNotice], sendNotice: async () => assert.fail('No new notice'), now: () => since })
    assert.equal(store.reads, 0)
  })
  test('유형·ID 크기·목록 순서와 무관하게 새 공지 모두 전달하고 수정·재조회에는 다시 보내지 않는다', async () => {
    const store = new MemoryStore(); await store.initialize([oldNotice]); member(store)
    const lowerId = { ...freshNotice, id: 99, title: '분실물 안내' }
    const delivered: number[] = []
    const deps = { fetchNotices: async () => [freshNotice, oldNotice, lowerId], sendNotice: async (_: unknown, notice: Notice) => { delivered.push(notice.id) }, now: () => since + 120000 }
    await pollNotices(noticeConfig(), store, deps)
    assert.deepEqual(delivered, [101, 99])
    await pollNotices(noticeConfig(), store, { ...deps, fetchNotices: async () => [{ ...freshNotice, title: '제목 수정' }, lowerId, oldNotice] })
    assert.deepEqual(delivered, [101, 99])
  })
  test('신청 이전 공지·기준 목록은 제외하고 신청 이후 공지만 보낸다', async () => {
    const store = new MemoryStore(); await store.initialize([]); member(store, 'one', { baseline: [101] })
    const sent: number[] = []
    await pollNotices(noticeConfig(), store, { fetchNotices: async () => [oldNotice, freshNotice, { ...freshNotice, id: 102 }], sendNotice: async (_: unknown, notice: Notice) => { sent.push(notice.id) }, now: () => since + 120000 })
    assert.deepEqual(sent, [102])
    assert.equal(noticeTime('2026-10-02T10:01:00'), Date.parse('2026-10-02T01:01:00Z'))
  })
  test('일부 발송 실패 후 재확인에서는 실패한 기기만 다시 보낸다', async () => {
    const store = new MemoryStore(); await store.initialize([oldNotice]); member(store); member(store, 'two', { subscription: { ...subscription, endpoint: `${subscription.endpoint}2` } })
    const sent: string[] = []; let fail = true
    const deps = { fetchNotices: async () => [freshNotice], sendNotice: async (target: typeof subscription) => {
      if (target.endpoint.endsWith('2') && fail) throw new Error('Temporary error')
      sent.push(target.endpoint)
    }, now: () => since + 120000 }
    assert.equal((await pollNotices(noticeConfig(), store, deps)).failed, 1)
    assert.equal(store.value?.pending.length, 1)
    fail = false; await pollNotices(noticeConfig(), store, deps)
    assert.equal(sent.length, 2); assert.equal(store.value?.pending.length, 0)
  })
  test('발송 직전 해제된 구독은 제외하고 만료된 기기는 저장소에서 제거한다', async t => {
    const store = new MemoryStore(); await store.initialize([oldNotice]); member(store); member(store, 'two')
    t.mock.method(store, 'get', async (id: string) => id === 'one' ? null : store.members[id])
    let calls = 0
    await pollNotices(noticeConfig(), store, { fetchNotices: async () => [freshNotice], sendNotice: async () => { calls++; throw { statusCode: 410 } }, now: () => since + 120000 })
    assert.equal(calls, 1); assert.equal(store.members.two, undefined); assert.equal(store.value?.pending.length, 0)
  })
  test('동시에 들어온 확인 요청은 중복 발송하지 않는다', async () => {
    const store = new MemoryStore(); store.owner = 'other-worker'
    assert.deepEqual(await pollNotices(noticeConfig(), store), { skipped: 'busy' })
    assert.equal(store.owner, 'other-worker')
  })
  test('구독자 200명에게 보내도 공지 조회는 한 번이며 완료 후 다시 보내지 않는다', async () => {
    const store = new MemoryStore(); await store.initialize([oldNotice])
    for (let index = 0; index < 200; index++) member(store, `device-${index}`)
    let queries = 0; let deliveries = 0
    const deps = { fetchNotices: async () => { queries++; return [freshNotice] }, sendNotice: async () => { deliveries++ }, now: () => since + 120000 }
    assert.equal((await pollNotices(noticeConfig(), store, deps)).sent, 200)
    assert.equal(queries, 1); assert.equal(deliveries, 200)
    await pollNotices(noticeConfig(), store, deps)
    assert.equal(deliveries, 200)
  })
  test('완료 기록 후 상태 저장 실패가 발생해도 재실행에서 성공한 기기로 재발송하지 않는다', async t => {
    const store = new MemoryStore(); await store.initialize([oldNotice]); member(store)
    let deliveries = 0; let saves = 0
    const originalSave = store.save.bind(store)
    const mock = t.mock.method(store, 'save', async (state: PollState, owner: string) => {
      if (++saves === 2) throw new Error('Interrupted after acknowledgement')
      await originalSave(state, owner)
    })
    const deps = { fetchNotices: async () => [freshNotice], sendNotice: async () => { deliveries++ }, now: () => since + 120000 }
    await assert.rejects(pollNotices(noticeConfig(), store, deps))
    assert.equal(store.value?.pending.length, 1)
    mock.mock.restore()
    await pollNotices(noticeConfig(), store, deps)
    assert.equal(deliveries, 1); assert.equal(store.value?.pending.length, 0)
  })
  test('7일 만료된 발송 대기는 종료하고 최근 50건 사이 누락 가능성을 보고한다', async () => {
    const store = new MemoryStore(); await store.initialize([oldNotice]); member(store)
    store.value!.pending = [{ ...freshNotice, observedAt: since - 8 * 86400_000 }]
    store.value!.seen.push(freshNotice.id)
    const notices = Array.from({ length: 50 }, (_, index) => ({ ...freshNotice, id: 200 + index }))
    const result = await pollNotices(noticeConfig(), store, { fetchNotices: async () => notices, sendNotice: async () => {}, now: () => since + 120000 })
    assert.equal(result.expired, 1); assert.equal(result.possibleGap, true)
  })
  test('공지 API 장애로 확인에 실패하면 기존 상태를 유지하고 잠금을 해제한다', async () => {
    const store = new MemoryStore(); await store.initialize([oldNotice])
    await assert.rejects(pollNotices(noticeConfig(), store))
    assert.deepEqual(store.value, { seen: [100], pending: [] }); assert.equal(store.owner, null)
  })
  test('시간 예산에 도달하면 미발송 공지를 다음 확인까지 보관한다', async () => {
    const store = new MemoryStore(); await store.initialize([oldNotice]); member(store)
    let now = since
    const result = await pollNotices(noticeConfig(), store, { fetchNotices: async () => { now += 36000; return [freshNotice] }, sendNotice: async () => assert.fail('Deadline'), now: () => now })
    assert.equal(result.pending, 1)
  })
  test('공개 설정에는 공개키만 반환하고 설정 누락은 성공 처리하지 않는다', async () => {
    assert.deepEqual(await (await handler.fetch(new Request(`${origin}/api/notice-notification`))).json(), { publicKey: keys.publicKey })
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    assert.equal((await handler.fetch(request())).status, 503)
  })
  test('다른 출처·내부 네트워크 구독·지원하지 않는 작업을 거부한다', async () => {
    assert.equal((await handler.fetch(request('subscribe', subscription, 'https://other.example'))).status, 403)
    assert.equal((await handler.fetch(request('subscribe', { ...subscription, endpoint: 'https://127.0.0.1/' }))).status, 400)
    assert.equal((await handler.fetch(request('send-to-everyone'))).status, 400)
    assert.equal((await handler.fetch(request('subscribe', null))).status, 400)
  })
  test('신청은 서버에 저장한 뒤 성공하고 재신청은 시작 기준을 초기화하지 않는다', async t => {
    let stored: string | null = null; let baseline: Notice[] = []; let reads = 0
    t.mock.method(RedisNoticeStore.prototype, 'get', async () => stored)
    t.mock.method(RedisNoticeStore.prototype, 'initialize', async (notices: Notice[]) => { baseline = notices })
    t.mock.method(RedisNoticeStore.prototype, 'add', async (id: string, value: string) => { assert.equal(id, subscriberId(subscription)); stored = value })
    globalThis.fetch = (async () => { reads++; return Response.json({ data: [oldNotice] }) }) as typeof fetch
    assert.equal((await handler.fetch(request())).status, 200)
    assert.ok(stored); assert.deepEqual(baseline.map(notice => notice.id), [100])
    const first = stored
    assert.deepEqual(openSubscriber(stored, keys.privateKey).baseline, [100])
    assert.equal((await handler.fetch(request())).status, 200)
    assert.equal(stored, first); assert.equal(reads, 1)
  })
  test('저장소 장애로 신청이 실패하면 성공을 표시하지 않는다', async t => {
    t.mock.method(RedisNoticeStore.prototype, 'get', async () => null)
    t.mock.method(RedisNoticeStore.prototype, 'initialize', async () => {})
    t.mock.method(RedisNoticeStore.prototype, 'add', async () => { throw new Error('Storage offline') })
    globalThis.fetch = (async () => Response.json({ data: [] })) as typeof fetch
    assert.equal((await handler.fetch(request())).status, 502)
  })
  test('구독 해제는 해당 구독만 삭제한다', async t => {
    const removed: string[] = []
    t.mock.method(RedisNoticeStore.prototype, 'get', async () => 'sealed-value')
    t.mock.method(RedisNoticeStore.prototype, 'remove', async (id: string, value: string) => { removed.push(id); assert.equal(value, 'sealed-value') })
    assert.deepEqual(await (await handler.fetch(request('unsubscribe'))).json(), { subscribed: false })
    assert.deepEqual(removed, [subscriberId(subscription)])
  })
  test('공지 API의 잘못된 응답은 빈 목록으로 취급하지 않는다', async () => {
    for (const data of [{}, { data: [{ ...freshNotice, createdAt: 'invalid' }] }, { data: [freshNotice, freshNotice] }]) {
      globalThis.fetch = (async () => Response.json(data)) as typeof fetch
      await assert.rejects(fetchNotices(noticeConfig()))
    }
  })
  test('서명 없는 호출과 다른 URL에 대한 서명을 거부하고 정상 서명만 확인 작업을 실행한다', async t => {
    const callback = noticeConfig().callback
    assert.equal((await pollHandler.fetch(new Request(callback, { method: 'POST', body: '{}' }))).status, 401)
    assert.equal((await pollHandler.fetch(new Request(callback, { method: 'POST', body: '{}', headers: { 'upstash-signature': sign('{}', `${origin}/wrong`) } }))).status, 401)
    t.mock.method(RedisNoticeStore.prototype, 'acquire', async () => false)
    assert.deepEqual(await (await pollHandler.fetch(new Request(callback, { method: 'POST', body: '{}', headers: { 'upstash-signature': sign('{}', callback) } }))).json(), { skipped: 'busy' })
  })
  test('발송 페이로드는 공지 상세 주소와 길이가 제한된 제목·본문을 포함한다', async t => {
    let payload: { type: string; noticeId: number; body: string; title: string; url: string } | undefined
    t.mock.method(webpush, 'sendNotification', async (_: unknown, data: string) => { payload = JSON.parse(data) })
    await sendNotice(subscription, { ...freshNotice, title: '제목'.repeat(100), body: '공지 내용\n'.repeat(100) }, noticeConfig())
    assert.equal(payload?.noticeId, 101); assert.equal(payload?.url, '/main#notices/101')
    assert.equal(payload?.title.length, 80); assert.equal(payload?.body.length, 180)
  })
})

test('공지 푸시는 공지별 태그를 표시하고 클릭하면 해당 공지로 이동한다', async () => {
  const handlers = new Map<string, (event: unknown) => void>()
  let options: { tag: string; data: { url: string } } | undefined
  let destination = ''
  const self = {
    addEventListener: (name: string, handler: (event: unknown) => void) => handlers.set(name, handler),
    registration: { showNotification: async (_: string, value: NonNullable<typeof options>) => { options = value } },
    clients: { matchAll: async () => [], openWindow: async (url: string) => { destination = url } },
  }
  runInNewContext(await readFile(new URL('../public/push-sw.js', import.meta.url), 'utf8'), { self, URL })
  let completion: Promise<void> | undefined
  const waitUntil = (promise: Promise<void>) => { completion = promise }
  handlers.get('push')!({ data: { json: () => ({ type: 'FESTIVAL_NOTICE', noticeId: 101, title: '공지', body: '안내', url: 'https://evil.example' }) }, waitUntil })
  await completion
  assert.equal(options?.tag, 'yu-festa-notice-101')
  handlers.get('notificationclick')!({ notification: { close: () => {}, data: options?.data }, waitUntil })
  await completion; assert.equal(destination, '/main#notices/101')
  for (const url of ['https://evil.example', '/main#notices/1/../../', '/main#notices/9007199254740992']) {
    handlers.get('notificationclick')!({ notification: { close: () => {}, data: { url } }, waitUntil })
    await completion; assert.equal(destination, '/')
  }
})
