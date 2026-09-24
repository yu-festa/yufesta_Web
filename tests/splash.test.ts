import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { markSplashSeen, shouldShowSplash } from '../src/utils/splash.ts'

const originalWindow = globalThis.window
afterEach(() => { Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true, writable: true }) })

function storage() {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}

function useStorage(localStorage: ReturnType<typeof storage>, sessionStorage = storage()) {
  Object.defineProperty(globalThis, 'window', { value: { localStorage, sessionStorage }, configurable: true, writable: true })
}

test('첫 접속만 표시하고 새로고침·새 탭·재방문에는 영구 기록을 사용한다', () => {
  const local = storage()
  useStorage(local)
  assert.equal(shouldShowSplash(), true)
  markSplashSeen()
  assert.equal(shouldShowSplash(), false)
  useStorage(local, storage())
  assert.equal(shouldShowSplash(), false)
})

test('기존 세션에서 이미 본 스플래시도 영구 기록으로 옮긴다', () => {
  const local = storage()
  const session = storage()
  session.setItem('yufesta:splash-seen', 'true')
  useStorage(local, session)
  assert.equal(shouldShowSplash(), false)
  markSplashSeen()
  useStorage(local, storage())
  assert.equal(shouldShowSplash(), false)
})

test('영구 저장소가 차단되면 세션 저장소로 대체한다', () => {
  const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
  useStorage(blocked)
  assert.equal(shouldShowSplash(), true)
  markSplashSeen()
  assert.equal(shouldShowSplash(), false)
  useStorage(blocked, blocked)
  assert.doesNotThrow(markSplashSeen)
  assert.equal(shouldShowSplash(), true)
})
