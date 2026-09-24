import { useCallback, useEffect, useRef, useState } from 'react'

// loader는 모듈 함수 또는 useCallback으로 고정합니다. 이전 요청이 최신 화면을 덮어쓰지 않습니다.
export function usePublicResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const sequence = useRef(0)
  const cancel = useCallback(() => { sequence.current++ }, [])
  const refresh = useCallback(async () => {
    const id = ++sequence.current
    setLoading(true)
    setError('')
    try { const value = await loader(); if (id === sequence.current) setData(value) }
    catch (reason) { if (id === sequence.current) setError(reason instanceof Error ? reason.message : '불러오지 못했어요. 다시 시도해 주세요.') }
    finally { if (id === sequence.current) setLoading(false) }
  }, [loader])
  const replaceData = useCallback((update: (current: T | null) => T) => {
    sequence.current++
    setData(update)
    setLoading(false)
    setError('')
  }, [])
  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => { if (active) { setData(null); void refresh() } })
    const focus = () => { if (document.visibilityState === 'visible') void refresh() }
    window.addEventListener('focus', focus)
    document.addEventListener('visibilitychange', focus)
    return () => { active = false; cancel(); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus) }
  }, [refresh, cancel])
  return { data, loading, error, refresh, replaceData }
}
