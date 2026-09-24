import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { ApiError, apiRequest } from '../src/api/client.ts'
import { getMe, logout, oauthLoginUrl } from '../src/api/auth.ts'

const originalFetch = globalThis.fetch
const originalDocument = globalThis.document

test('카카오와 구글 로그인은 로그인 성공 후 메인 화면으로 복귀하도록 요청한다', () => {
  for (const provider of ['kakao', 'google'] as const) {
    const url = new URL(oauthLoginUrl(provider))
    assert.equal(url.pathname, `/oauth2/authorization/${provider}`)
    assert.equal(url.searchParams.get('redirect'), '/main')
    assert.equal(url.hash, '')
  }
})

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

  assert.deepEqual(await getMe(), { role: 'USER' })
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

  assert.equal(await logout(), undefined)
  assert.equal(calls.length, 2)
  assert.ok(calls[0]?.url.endsWith('/api/v1/auth/csrf'))
  assert.equal(calls[1]?.headers.get('X-XSRF-TOKEN'), 'test-token')
})

test('비로그인 상태 조회의 401과 서버 메시지를 유지한다', async () => {
  globalThis.fetch = (async (input, init) => {
    assert.ok(String(input).endsWith('/api/v1/auth/me'))
    assert.equal(init?.method, 'GET')
    assert.equal(init?.credentials, 'include')
    return Response.json({ status: 401, code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', errors: [] }, { status: 401 })
  }) as typeof fetch
  await assert.rejects(getMe, (error: unknown) => error instanceof ApiError && error.status === 401 && error.code === 'UNAUTHORIZED')
})

test('동시 쓰기 요청은 CSRF 발급을 공유하고 이후에는 쿠키를 재사용한다', async () => {
  const doc = { cookie: '' }
  Object.defineProperty(globalThis, 'document', { value: doc, configurable: true, writable: true })
  let issueCount = 0
  let writeCount = 0
  globalThis.fetch = (async (input, init) => {
    assert.equal(init?.credentials, 'include')
    if (String(input).endsWith('/csrf')) {
      issueCount++
      await Promise.resolve()
      doc.cookie = 'XSRF-TOKEN=encoded%2Btoken%3D'
    } else {
      writeCount++
      assert.equal(new Headers(init?.headers).get('X-XSRF-TOKEN'), 'encoded+token=')
    }
    return new Response(null, { status: 204 })
  }) as typeof fetch
  await Promise.all([apiRequest('/api/v1/example', { method: 'POST' }), apiRequest('/api/v1/example', { method: 'DELETE' })])
  await logout()
  assert.equal(issueCount, 1)
  assert.equal(writeCount, 3)
})

test('CSRF 발급 후 쿠키가 없으면 쓰기를 보내지 않고 다음 시도에서 다시 발급한다', async () => {
  const doc = { cookie: '' }
  Object.defineProperty(globalThis, 'document', { value: doc, configurable: true, writable: true })
  const calls: string[] = []
  globalThis.fetch = (async input => {
    calls.push(new URL(String(input)).pathname)
    if (calls.length === 2) doc.cookie = 'XSRF-TOKEN=retry-token'
    return new Response(null, { status: 204 })
  }) as typeof fetch
  await assert.rejects(logout, (error: unknown) => error instanceof ApiError && error.code === 'CSRF_TOKEN_UNAVAILABLE')
  assert.deepEqual(calls, ['/api/v1/auth/csrf'])
  await logout()
  assert.deepEqual(calls, ['/api/v1/auth/csrf', '/api/v1/auth/csrf', '/api/v1/auth/logout'])
})

test('CSRF 발급 실패 시 로그아웃을 보내지 않고 오류를 전달한다', async () => {
  Object.defineProperty(globalThis, 'document', { value: { cookie: '' }, configurable: true, writable: true })
  globalThis.fetch = (async input => {
    assert.ok(String(input).endsWith('/api/v1/auth/csrf'))
    return Response.json({ status: 403, code: 'FORBIDDEN', message: '요청이 거부됐어요.', errors: [] }, { status: 403 })
  }) as typeof fetch
  await assert.rejects(logout, (error: unknown) => error instanceof ApiError && error.status === 403 && error.message === '요청이 거부됐어요.')
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
