import assert from 'node:assert/strict'
import { createHash, createHmac, randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, test } from 'node:test'
import webpush from 'web-push'
import schedule from '../api/open-notification.ts'
import deliver from '../api/open-notification-deliver.ts'
import { DEFAULT_OPEN_PUSH_AT, openJob, sealJob } from '../server/pushSchedule.ts'

const origin = 'https://yufesta.example'
const callback = `${origin}/api/open-notification-deliver`
const sendAt = Date.parse(DEFAULT_OPEN_PUSH_AT)
const keys = webpush.generateVAPIDKeys()
const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: { p256dh: Buffer.concat([Buffer.from([4]), randomBytes(64)]).toString('base64url'), auth: randomBytes(16).toString('base64url') } }
const env = { VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey, QSTASH_TOKEN: 'test-qstash', QSTASH_CURRENT_SIGNING_KEY: 'current-test-signing-key', QSTASH_NEXT_SIGNING_KEY: 'next-test-signing-key', PUSH_PUBLIC_ORIGIN: origin, PUSH_OPEN_AT: DEFAULT_OPEN_PUSH_AT, PUSH_OPEN_MODE: 'test' }
const originalEnv = Object.fromEntries(Object.keys(env).map(name => [name, process.env[name]]))
const originalFetch = globalThis.fetch
const originalNow = Date.now

function request(body: unknown = { subscription }, requestOrigin = origin) {
  return new Request(`${origin}/api/open-notification`, { method: 'POST', headers: { Origin: requestOrigin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}
function sign(body: string, url = callback, secret = env.QSTASH_CURRENT_SIGNING_KEY) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iss: 'Upstash', sub: url, nbf: 0, exp: Math.floor(originalNow() / 1000) + 600, body: createHash('sha256').update(body).digest('base64url') })).toString('base64url')
  return `${header}.${payload}.${createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')}`
}
function deliveryBody(at = sendAt) {
  return JSON.stringify({ job: sealJob({ subscription, sendAt: at, mode: 'test' }, keys.privateKey) })
}
function callbackRequest(body = deliveryBody(), signature = sign(body)) {
  return new Request(callback, { method: 'POST', headers: { 'Upstash-Signature': signature, 'Content-Type': 'application/json' }, body })
}

describe('예약 오픈 알림', { concurrency: false }, () => {
  beforeEach(() => {
    Object.assign(process.env, env)
    Date.now = () => sendAt - 60_000
    globalThis.fetch = (() => { throw new Error('Unexpected network call') }) as typeof fetch
  })
  afterEach(() => {
    Date.now = originalNow; globalThis.fetch = originalFetch
    for (const [name, value] of Object.entries(originalEnv)) { if (value === undefined) delete process.env[name]; else process.env[name] = value }
  })

  test('한국 시간 18:30 예약 정보와 공개키만 반환한다', async () => {
    assert.equal(DEFAULT_OPEN_PUSH_AT, '2026-09-26T18:30:00+09:00')
    const response = await schedule.fetch(new Request(`${origin}/api/open-notification`))
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), { publicKey: keys.publicKey, sendAt: '2026-09-26T09:30:00.000Z', accepting: true, mode: 'test' })
  })

  test('설정 누락은 신청 성공으로 표시하지 않는다', async () => {
    delete process.env.QSTASH_TOKEN
    assert.equal((await schedule.fetch(request())).status, 503)
    assert.equal((await deliver.fetch(callbackRequest())).status, 503)
  })

  test('다른 출처·잘못된 구독·내부 서버 주소를 차단한다', async () => {
    assert.equal((await schedule.fetch(request({ subscription }, 'https://other.example'))).status, 403)
    assert.equal((await schedule.fetch(request({ subscription: { ...subscription, endpoint: 'https://127.0.0.1/private' } }))).status, 400)
    assert.equal((await schedule.fetch(request({ subscription: null }))).status, 400)
    assert.equal((await schedule.fetch(request(null))).status, 400)
    assert.equal((await schedule.fetch(new Request(`${origin}/api/open-notification`, { method: 'DELETE' }))).status, 405)
  })

  test('과거·마감 직전·7일보다 먼 날짜에는 예약을 생성하지 않는다', async () => {
    for (const now of [sendAt + 1, sendAt - 9999, sendAt - 8 * 24 * 60 * 60 * 1000]) {
      Date.now = () => now
      assert.equal((await schedule.fetch(request())).status, 409)
      const info = await (await schedule.fetch(new Request(`${origin}/api/open-notification`))).json()
      assert.equal(info.accepting, false)
    }
  })

  test('구독은 암호화해 지정 시각으로 예약하고 클라이언트 시각·메시지를 무시한다', async () => {
    const calls: { url: string; headers: Headers; body: string }[] = []
    globalThis.fetch = (async (input, init) => {
      calls.push({ url: String(input), headers: new Headers(init?.headers), body: String(init?.body) })
      return Response.json({ messageId: 'scheduled-message' })
    }) as typeof fetch
    const response = await schedule.fetch(request({ subscription, sendAt: '2030-01-01', title: 'ignored' }))
    assert.equal(response.status, 202)
    assert.equal((await response.json()).accepted, true)
    assert.equal(calls.length, 1)
    assert.ok(calls[0].url.endsWith(`/v2/publish/${callback}`))
    assert.equal(calls[0].headers.get('Upstash-Not-Before'), String(sendAt / 1000))
    assert.ok(calls[0].headers.get('Upstash-Deduplication-Id'))
    assert.equal(calls[0].body.includes(subscription.endpoint), false)
    assert.equal(calls[0].body.includes(keys.privateKey), false)
    assert.deepEqual(openJob(JSON.parse(calls[0].body).job, keys.privateKey), { subscription, sendAt, mode: 'test' })
  })

  test('예약 저장 실패를 성공 처리하거나 자동 중복 요청하지 않는다', async () => {
    let calls = 0
    globalThis.fetch = (async () => { calls++; return Response.json({ error: 'unavailable' }, { status: 503 }) }) as typeof fetch
    assert.equal((await schedule.fetch(request())).status, 502)
    assert.equal(calls, 1)
  })

  test('서명·본문·수신 주소가 변조된 콜백은 푸시를 발송하지 않는다', async t => {
    const sender = t.mock.method(webpush, 'sendNotification', async () => ({ statusCode: 201, body: '', headers: {} }))
    const body = deliveryBody()
    for (const signature of ['', sign(body, callback, 'wrong-key'), sign(body, `${origin}/other`), sign(`${body} `)]) {
      assert.equal((await deliver.fetch(callbackRequest(body, signature))).status, 401)
    }
    assert.equal(sender.mock.callCount(), 0)
  })

  test('예약 시각 전에는 발송하지 않고 해당 시각부터 실제 푸시를 요청한다', async t => {
    const sender = t.mock.method(webpush, 'sendNotification', async () => ({ statusCode: 201, body: '', headers: {} }))
    assert.equal((await deliver.fetch(callbackRequest())).status, 425)
    assert.equal(sender.mock.callCount(), 0)
    Date.now = () => sendAt
    assert.equal((await deliver.fetch(callbackRequest())).status, 200)
    assert.equal(sender.mock.callCount(), 1)
    const [, payload, options] = sender.mock.calls[0].arguments
    assert.equal(JSON.parse(String(payload)).url, '/main')
    assert.equal(JSON.parse(String(payload)).type, 'FESTIVAL_OPEN')
    assert.match(JSON.parse(String(payload)).title, /테스트/)
    assert.equal(options?.vapidDetails?.privateKey, keys.privateKey)
  })

  test('다음 서명키도 검증하고 만료 구독·오래된 예약·변경된 예약을 재발송하지 않는다', async t => {
    const sender = t.mock.method(webpush, 'sendNotification', async () => { throw Object.assign(new Error('expired'), { statusCode: 410 }) })
    Date.now = () => sendAt
    const body = deliveryBody()
    assert.equal((await (await deliver.fetch(callbackRequest(body, sign(body, callback, env.QSTASH_NEXT_SIGNING_KEY)))).json()).skipped, 'subscription-expired')
    Date.now = () => sendAt + 3_600_001
    assert.equal((await (await deliver.fetch(callbackRequest())).json()).skipped, 'expired')
    process.env.PUSH_OPEN_AT = new Date(sendAt + 3_600_000).toISOString()
    assert.equal((await (await deliver.fetch(callbackRequest())).json()).skipped, 'campaign-changed')
    assert.equal(sender.mock.callCount(), 1)
  })

  test('푸시 서비스 일시 실패는 예약 서비스가 재시도할 수 있게 반환한다', async t => {
    t.mock.method(webpush, 'sendNotification', async () => { throw new Error('temporary failure') })
    Date.now = () => sendAt
    assert.equal((await deliver.fetch(callbackRequest())).status, 502)
  })
})
