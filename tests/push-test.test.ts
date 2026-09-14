import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, test } from 'node:test'
import { runInNewContext } from 'node:vm'
import webpush from 'web-push'
import handler from '../api/push-test.ts'

const origin = 'https://yu-festa.example'
const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-subscription',
  keys: {
    p256dh: Buffer.concat([Buffer.from([4]), randomBytes(64)]).toString('base64url'),
    auth: randomBytes(16).toString('base64url'),
  },
}
const keys = webpush.generateVAPIDKeys()
const originalPublicKey = process.env.VAPID_PUBLIC_KEY
const originalPrivateKey = process.env.VAPID_PRIVATE_KEY

function request(overrides: object = {}, requestOrigin = origin) {
  return new Request(`${origin}/api/push-test`, {
    method: 'POST',
    headers: { Origin: requestOrigin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription, testId: randomUUID(), delayMs: 0, ...overrides }),
  })
}

describe('푸시 테스트 API', { concurrency: false }, () => {
  beforeEach(() => {
    process.env.VAPID_PUBLIC_KEY = keys.publicKey
    process.env.VAPID_PRIVATE_KEY = keys.privateKey
  })
  afterEach(() => {
    if (originalPublicKey === undefined) delete process.env.VAPID_PUBLIC_KEY
    else process.env.VAPID_PUBLIC_KEY = originalPublicKey
    if (originalPrivateKey === undefined) delete process.env.VAPID_PRIVATE_KEY
    else process.env.VAPID_PRIVATE_KEY = originalPrivateKey
  })

  test('클라이언트에는 공개키만 반환한다', async () => {
    const response = await handler.fetch(new Request(`${origin}/api/push-test`))
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), { publicKey: keys.publicKey })
  })

  test('비밀키가 없으면 설정 누락으로 응답한다', async () => {
    delete process.env.VAPID_PRIVATE_KEY
    const response = await handler.fetch(new Request(`${origin}/api/push-test`))
    assert.equal(response.status, 503)
  })

  test('요청한 3초가 지난 뒤 고정된 테스트 알림을 한 번만 보낸다', async t => {
    const sender = t.mock.method(webpush, 'sendNotification', async () => ({ statusCode: 201, body: '', headers: {} }))
    const testId = randomUUID()
    const started = performance.now()
    const response = await handler.fetch(request({ delayMs: 3000, testId, title: '무시해야 하는 외부 입력' }))
    assert.ok(performance.now() - started >= 2900)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { accepted: true, testId })
    assert.equal(sender.mock.callCount(), 1)
    const [, payload, options] = sender.mock.calls[0].arguments
    assert.equal(JSON.parse(String(payload)).title, 'YU FESTA 테스트 알림')
    assert.equal(JSON.parse(String(payload)).testId, testId)
    assert.equal(options?.TTL, 60)
    assert.equal(options?.vapidDetails?.privateKey, keys.privateKey)
  })

  test('다른 사이트의 전송 요청을 차단한다', async t => {
    const sender = t.mock.method(webpush, 'sendNotification', async () => { throw new Error('전송되면 안 됨') })
    assert.equal((await handler.fetch(request({}, 'https://another.example'))).status, 403)
    assert.equal(sender.mock.callCount(), 0)
  })

  test('임의 서버나 내부 주소를 푸시 대상으로 사용할 수 없다', async t => {
    const sender = t.mock.method(webpush, 'sendNotification', async () => { throw new Error('전송되면 안 됨') })
    for (const endpoint of [
      'http://127.0.0.1/internal',
      'https://another.example/push',
      'https://fcm.googleapis.com.another.example/push',
      'https://user:password@fcm.googleapis.com/push',
      'https://fcm.googleapis.com:8443/push',
    ]) {
      assert.equal((await handler.fetch(request({ subscription: { ...subscription, endpoint } }))).status, 400)
    }
    assert.equal(sender.mock.callCount(), 0)
  })

  test('3초 범위 밖의 대기 시간과 잘못된 구독을 거부한다', async () => {
    for (const delayMs of [-1, 3001, '3000', null]) {
      assert.equal((await handler.fetch(request({ delayMs }))).status, 400)
    }
    assert.equal((await handler.fetch(request({ subscription: { ...subscription, keys: {} } }))).status, 400)
  })

  test('만료된 구독은 다시 연결할 수 있도록 410을 반환한다', async t => {
    t.mock.method(webpush, 'sendNotification', async () => { throw { statusCode: 410 } })
    assert.equal((await handler.fetch(request())).status, 410)
  })

  test('푸시 서비스 실패를 수신 성공으로 처리하지 않는다', async t => {
    t.mock.method(webpush, 'sendNotification', async () => { throw new Error('Network failure') })
    assert.equal((await handler.fetch(request())).status, 502)
  })

  test('지원하지 않는 메서드와 잘못된 본문을 거부한다', async () => {
    assert.equal((await handler.fetch(new Request(`${origin}/api/push-test`, { method: 'DELETE' }))).status, 405)
    const invalid = new Request(`${origin}/api/push-test`, {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{',
    })
    assert.equal((await handler.fetch(invalid)).status, 400)
  })
})

test('서비스 워커는 실제 push 이벤트에서 알림을 표시하고 수신 상태를 알린다', async () => {
  const handlers = new Map<string, (event: unknown) => void>()
  const notifications: Array<{ title: string; options: { body: string; data: { testId: string } } }> = []
  const messages: unknown[] = []
  const self = {
    addEventListener: (name: string, callback: (event: unknown) => void) => handlers.set(name, callback),
    registration: { showNotification: async (title: string, options: typeof notifications[number]['options']) => {
      notifications.push({ title, options })
    } },
    clients: { matchAll: async () => [{ postMessage: (message: unknown) => messages.push(message) }] },
  }
  runInNewContext(await readFile(new URL('../public/push-sw.js', import.meta.url), 'utf8'), { self, URL })
  let completed: Promise<void> | undefined
  handlers.get('push')!({
    data: { json: () => ({ title: '테스트', body: '도착', testId: 'test-id' }) },
    waitUntil: (promise: Promise<void>) => { completed = promise },
  })
  await completed
  assert.equal(notifications.length, 1)
  assert.equal(notifications[0].title, '테스트')
  assert.equal(notifications[0].options.data.testId, 'test-id')
  assert.deepEqual(JSON.parse(JSON.stringify(messages)), [{ type: 'PUSH_TEST_RECEIVED', testId: 'test-id' }])
})

test('알림 클릭 시 기존 앱 창으로 이동한다', async () => {
  const handlers = new Map<string, (event: unknown) => void>()
  let closed = false
  let focused = false
  const self = {
    addEventListener: (name: string, callback: (event: unknown) => void) => handlers.set(name, callback),
    clients: { matchAll: async () => [{ url: `${origin}/`, focus: async () => { focused = true } }] },
  }
  runInNewContext(await readFile(new URL('../public/push-sw.js', import.meta.url), 'utf8'), { self, URL })
  let completed: Promise<void> | undefined
  handlers.get('notificationclick')!({
    notification: { close: () => { closed = true } },
    waitUntil: (promise: Promise<void>) => { completed = promise },
  })
  await completed
  assert.ok(closed && focused)
})
