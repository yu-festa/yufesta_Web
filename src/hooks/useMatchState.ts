import { useCallback, useEffect, useRef, useState } from 'react'
import { getMe } from '../api/auth'
import { ApiError } from '../api/client'
import { getMatchSummary, getMyApplication } from '../api/match'
import type { MatchSummary } from '../api/match'
import { profileFromApplication } from '../utils/profile'
import type { ProfileUser } from '../utils/profile'
import { isMatchOpen } from '../utils/match'

export function useMatchState(enabled = true) {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'anonymous' | 'unavailable'>('loading')
  const [summary, setSummary] = useState<MatchSummary | null>(null)
  const [profile, setProfile] = useState<ProfileUser | null>(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [receivedAt, setReceivedAt] = useState(0)
  const [now, setNow] = useState(Date.now)
  const requestId = useRef(0)
  const cancelRefresh = useCallback(() => { requestId.current++ }, [])

  const clearSession = useCallback(() => {
    // 로그아웃 전에 시작한 조회가 뒤늦게 로그인 상태를 복원하지 않도록 무효화합니다.
    requestId.current++
    setAuthStatus('anonymous')
    setProfile(null)
    setSummary(current => current ? { ...current, my: null } : null)
    setError('')
    setRefreshing(false)
  }, [])

  const refresh = useCallback(async () => {
    const id = ++requestId.current
    setRefreshing(true)
    const [auth, snapshot] = await Promise.allSettled([
      getMe(), getMatchSummary().then(data => ({ data, receivedAt: Date.now() })),
    ])
    if (id !== requestId.current) return
    const authenticated = auth.status === 'fulfilled'
    setAuthStatus(authenticated ? 'authenticated' : auth.reason instanceof ApiError && auth.reason.status === 401 ? 'anonymous' : 'unavailable')
    let message = ''
    if (snapshot.status === 'fulfilled') {
      setSummary(snapshot.value.data)
      setReceivedAt(snapshot.value.receivedAt)
    } else {
      setSummary(null)
      message = snapshot.reason instanceof Error ? snapshot.reason.message : '인스타팅 정보를 불러오지 못했어요.'
    }
    if (authenticated) {
      setProfile(current => current ?? profileFromApplication(null))
      try {
        const application = await getMyApplication().catch(reason => {
          if (reason instanceof ApiError && reason.status === 404) return null
          throw reason
        })
        if (id !== requestId.current) return
        setProfile(profileFromApplication(application, snapshot.status === 'fulfilled' ? snapshot.value.data : null))
      } catch (reason) {
        if (id !== requestId.current) return
        if (reason instanceof ApiError && reason.status === 401) {
          setAuthStatus('anonymous')
          setProfile(null)
        }
        message = reason instanceof Error ? reason.message : '신청 내역을 불러오지 못했어요.'
      }
    } else {
      setProfile(null)
      if (!(auth.reason instanceof ApiError && auth.reason.status === 401)) message ||= '로그인 상태를 확인하지 못했어요. 다시 시도해 주세요.'
    }
    if (id !== requestId.current) return
    setError(message)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    if (!enabled) return
    // 초기 상태는 이미 loading이며, 비동기 조회 완료 후 화면을 갱신합니다.
    let active = true
    void Promise.resolve().then(() => { if (active) void refresh() })
    const onFocus = () => { if (document.visibilityState === 'visible') void refresh() }
    const timer = window.setInterval(onFocus, 30000)
    const clock = window.setInterval(() => setNow(Date.now()), 1000)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      active = false
      cancelRefresh()
      clearInterval(timer)
      clearInterval(clock)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [enabled, refresh, cancelRefresh])

  return {
    authStatus, summary, profile, error, refreshing, refresh, clearSession, receivedAt,
    canApply: !error && !refreshing && isMatchOpen(summary, receivedAt, now),
    alreadyApplied: Boolean(summary?.my?.applied || profile?.participations.some(item => item.roundSeq === summary?.currentRound.seq)),
  }
}
