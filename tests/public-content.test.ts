import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { getCheers, createCheer } from '../src/api/cheers.ts'
import { getNotices, getNotice } from '../src/api/notices.ts'
import { ApiError } from '../src/api/client.ts'
import { formatContentTime } from '../src/utils/publicContent.ts'

const originalFetch = globalThis.fetch
const originalDocument = globalThis.document
afterEach(() => {
  globalThis.fetch = originalFetch
  Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true, writable: true })
})

test('익명 응원 등록도 CSRF와 쿠키를 사용하고 서버가 정한 작성자·ID를 반환한다', async () => {
  const doc = { cookie: '' }
  Object.defineProperty(globalThis, 'document', { value: doc, configurable: true, writable: true })
  const calls: string[] = []
  const cheer = { id: 12, content: '축제 파이팅!', displayName: '익명의 수달', mine: true, createdAt: '2026-09-24T01:00:00Z' }
  globalThis.fetch = (async (input, init) => {
    const url = new URL(String(input))
    calls.push(url.pathname)
    assert.equal(init?.credentials, 'include')
    if (url.pathname.endsWith('/csrf')) { doc.cookie = 'XSRF-TOKEN=cheer-token'; return new Response(null, { status: 204 }) }
    if (init?.method === 'POST') {
      assert.equal(new Headers(init.headers).get('X-XSRF-TOKEN'), 'cheer-token')
      assert.deepEqual(JSON.parse(String(init.body)), { content: '축제 파이팅!' })
      return Response.json({ data: cheer }, { status: 201 })
    }
    assert.equal(url.searchParams.get('size'), '50')
    return Response.json({ data: [cheer] })
  }) as typeof fetch
  assert.deepEqual(await createCheer('  축제 파이팅! '), cheer)
  assert.deepEqual(await getCheers(), [cheer])
  assert.deepEqual(calls, ['/api/v1/auth/csrf', '/api/v1/cheers', '/api/v1/cheers'])
})

test('빈 글과 40자를 넘는 응원은 보내지 않고 서버 거절을 성공으로 처리하지 않는다', async () => {
  Object.defineProperty(globalThis, 'document', { value: { cookie: 'XSRF-TOKEN=token' }, configurable: true, writable: true })
  let calls = 0
  globalThis.fetch = (async () => { calls++; return Response.json({ message: '잠시 후 다시 등록해 주세요.', code: 'RATE_LIMITED' }, { status: 429 }) }) as typeof fetch
  assert.throws(() => createCheer('  '), /40자/)
  assert.throws(() => createCheer('가'.repeat(41)), /40자/)
  assert.equal(calls, 0)
  await assert.rejects(() => createCheer('가'.repeat(40)), (error: unknown) => error instanceof ApiError && error.status === 429)
})

test('공지 최신 목록과 상세를 따로 조회하고 삭제된 공지의 404를 유지한다', async () => {
  const notice = { id: 5, title: '축제 안내', body: '첫째 줄\n둘째 줄', banner: true, createdAt: '2026-09-24T00:00:00Z' }
  globalThis.fetch = (async (input, init) => {
    assert.equal(init?.method, 'GET')
    const url = new URL(String(input))
    if (url.pathname.endsWith('/notices')) { assert.equal(url.searchParams.get('size'), '50'); return Response.json({ data: [notice] }) }
    if (url.pathname.endsWith('/5')) return Response.json({ data: notice })
    return Response.json({ message: '공지를 찾을 수 없어요.' }, { status: 404 })
  }) as typeof fetch
  assert.deepEqual(await getNotices(), [notice])
  assert.deepEqual(await getNotice(5), notice)
  await assert.rejects(() => getNotice(6), (error: unknown) => error instanceof ApiError && error.status === 404)
})

test('공개 콘텐츠의 시각은 KST로 표시하며 잘못된 날짜로 화면을 깨뜨리지 않는다', () => {
  assert.equal(formatContentTime('2026-09-24T00:00:00Z'), formatContentTime('2026-09-24T09:00:00'))
  assert.equal(formatContentTime('bad date'), '')
})
