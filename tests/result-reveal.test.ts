import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { createResultRevealStore, resultRevealStore } from '../src/utils/resultReveal.ts'
import { getMe, logout } from '../src/api/auth.ts'

function memoryStorage() {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}

const originalFetch = globalThis.fetch
const originalDocument = globalThis.document
afterEach(() => {
  globalThis.fetch = originalFetch
  Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true, writable: true })
  resultRevealStore.clear()
})

test('공개한 회차는 재진입·새로고침 후에도 기억하고 다른 회차는 처음부터 공개한다', () => {
  const storage = memoryStorage()
  const firstVisit = createResultRevealStore(() => storage)
  assert.equal(firstVisit.has(1), false)
  assert.equal(firstVisit.has(undefined), false)
  firstVisit.mark(1)
  const nextVisit = createResultRevealStore(() => storage)
  assert.equal(nextVisit.has(1), true)
  assert.equal(nextVisit.has(2), false)
  nextVisit.mark(2)
  assert.equal(firstVisit.has(1), true)
  assert.equal(firstVisit.has(2), true)
})

test('계정 전환으로 기록을 지우면 다른 탭도 이전 회차를 공개한 것으로 처리하지 않는다', () => {
  const storage = memoryStorage()
  const firstTab = createResultRevealStore(() => storage)
  const secondTab = createResultRevealStore(() => storage)
  firstTab.mark(1)
  assert.equal(secondTab.has(1), true)
  firstTab.clear()
  assert.equal(secondTab.has(1), false)
})

test('저장소가 차단되거나 쓰기가 실패해도 결과 공개와 현재 페이지 내 재진입은 가능하다', () => {
  for (const getStorage of [
    () => { throw new Error('blocked') },
    () => ({ getItem: () => null, setItem: () => { throw new Error('quota') } }),
  ]) {
    const store = createResultRevealStore(getStorage)
    assert.equal(store.has(1), false)
    assert.doesNotThrow(() => store.mark(1))
    assert.equal(store.has(1), true)
    store.clear()
    assert.equal(store.has(1), false)
  }
})

test('손상된 저장값과 유효하지 않은 회차는 결과를 미리 공개하지 않는다', () => {
  for (const raw of ['{broken', '{}', '[null,"1",-1,0,1.5]']) {
    const store = createResultRevealStore(() => ({ getItem: () => raw, setItem: () => {} }))
    assert.equal(store.has(1), false)
    for (const invalid of [NaN, -1, 0, 1.5]) { store.mark(invalid); assert.equal(store.has(invalid), false) }
  }
})

test('로그아웃 성공 시에만 공개 기록을 지우고 로그아웃 실패에는 유지한다', async () => {
  Object.defineProperty(globalThis, 'document', { value: { cookie: 'XSRF-TOKEN=token' }, configurable: true, writable: true })
  resultRevealStore.mark(1)
  globalThis.fetch = (async () => new Response(null, { status: 500 })) as typeof fetch
  await assert.rejects(logout)
  assert.equal(resultRevealStore.has(1), true)
  globalThis.fetch = (async () => new Response(null, { status: 204 })) as typeof fetch
  await logout()
  assert.equal(resultRevealStore.has(1), false)
})

test('인증 만료에는 공개 기록을 지우고 일시적인 로그인 조회 실패에는 유지한다', async () => {
  resultRevealStore.mark(1)
  globalThis.fetch = (async () => new Response(null, { status: 503 })) as typeof fetch
  await assert.rejects(getMe)
  assert.equal(resultRevealStore.has(1), true)
  globalThis.fetch = (async () => new Response(null, { status: 401 })) as typeof fetch
  await assert.rejects(getMe)
  assert.equal(resultRevealStore.has(1), false)
})
