import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { ApiError, apiRequest } from '../src/api/client.ts'

const originalFetch = globalThis.fetch
const originalDocument = globalThis.document

afterEach(() => {
  globalThis.fetch = originalFetch
  Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true, writable: true })
})

test('공통 API 클라이언트가 쿠키를 포함하고 성공 응답의 data를 반환한다', async () => {
  let credentials: RequestCredentials | undefined
  globalThis.fetch = (async (_input, init) => {
    credentials = init?.credentials
    return new Response(JSON.stringify({ status: 200, message: 'ok', data: { role: 'USER' } }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch

  assert.deepEqual(await apiRequest('/api/v1/auth/me'), { role: 'USER' })
  assert.equal(credentials, 'include')
})

test('쓰기 요청 전에 CSRF 쿠키를 발급받아 헤더로 보낸다', async () => {
  const documentStub = { cookie: '' }
  Object.defineProperty(globalThis, 'document', { value: documentStub, configurable: true, writable: true })
  const calls: { url: string; headers: Headers }[] = []
  globalThis.fetch = (async (input, init) => {
    const url = String(input)
    calls.push({ url, headers: new Headers(init?.headers) })
    if (url.endsWith('/api/v1/auth/csrf')) {
      documentStub.cookie = 'XSRF-TOKEN=test-token'
      return new Response(null, { status: 204 })
    }
    return new Response(null, { status: 204 })
  }) as typeof fetch

  await apiRequest('/api/v1/auth/logout', { method: 'POST' })
  assert.equal(calls.length, 2)
  assert.ok(calls[0]?.url.endsWith('/api/v1/auth/csrf'))
  assert.equal(calls[1]?.headers.get('X-XSRF-TOKEN'), 'test-token')
})

test('백엔드 오류 응답을 상태와 코드가 있는 ApiError로 변환한다', async () => {
  globalThis.fetch = (async () => new Response(JSON.stringify({
    status: 409, code: 'MATCH_ROUND_NOT_OPEN', message: '지금은 신청을 받지 않는 시간이에요.', errors: [],
  }), { status: 409, headers: { 'Content-Type': 'application/json' } })) as typeof fetch

  await assert.rejects(() => apiRequest('/api/v1/example'), (error: unknown) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.status, 409)
    assert.equal(error.code, 'MATCH_ROUND_NOT_OPEN')
    return true
  })
})
