import { useCallback, useEffect, useRef, useState } from 'react'
import { getMe } from '../api/auth'
import type { AuthMe, UserRole } from '../api/auth'
import { isAdminRole } from '../utils/admin'
import { ApiError, apiUrl } from '../api/client'
import { getMatchSummary, getMyApplication, getMyMatchResults } from '../api/match'
import type { MatchSummary, MatchApplication, MyMatchResult } from '../api/match'
import { profileFromSession } from '../utils/profile'
import type { ProfileUser } from '../utils/profile'
import { isMatchOpen } from '../utils/match'
import { resultRevealStore } from '../utils/resultReveal'
import { connectMatchEvents } from '../utils/matchEvents'
import { matchDeadline, matchServerTime } from '../utils/matchClock'

export function useMatchState(enabled = true, authOnly = false) {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'anonymous' | 'unavailable'>('loading')
  const [role, setRole] = useState<UserRole | null>(null)
  const [summary, setSummary] = useState<MatchSummary | null>(null)
  const [application, setApplication] = useState<MatchApplication | null>(null)
  const [profile, setProfile] = useState<ProfileUser | null>(null)
  const [latestResult, setLatestResult] = useState<MyMatchResult | null>(null)
  const [resultRevision, setResultRevision] = useState(0)
  const [sessionRevision, setSessionRevision] = useState(0)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [receivedAt, setReceivedAt] = useState(0)
  const [now, setNow] = useState(() => performance.now())
  const auth = useRef<AuthMe | null>(null)
  const authReady = useRef(false)
  const authRequest = useRef<Promise<void> | null>(null)
  const authGeneration = useRef(0)
  const requestId = useRef(0)
  const mode = useRef({ enabled, authOnly })
  const stream = useRef<ReturnType<typeof connectMatchEvents> | null>(null)
  const inFlight = useRef<Promise<void> | null>(null)
  const queued = useRef(false)
  const queuedResults = useRef(false)
  const resultContext = useRef('')
  const deadlineAttempt = useRef({ key: '', at: -Infinity })

  const clearSession = useCallback(() => {
    authGeneration.current++
    requestId.current++
    auth.current = null
    authReady.current = true
    authRequest.current = Promise.resolve()
    resultContext.current = ''
    stream.current?.close()
    resultRevealStore.clear()
    setAuthStatus('anonymous')
    setRole(null)
    setProfile(null)
    setApplication(null)
    setLatestResult(null)
    setSummary(current => current ? { ...current, my: null } : null)
    setError('')
    setRefreshing(false)
    setSessionRevision(value => value + 1)
  }, [])

  const authenticate = useCallback((force = false) => {
    if (authRequest.current && !force) return authRequest.current
    const generation = ++authGeneration.current
    requestId.current++
    queued.current = false
    authReady.current = false
    auth.current = null
    resultContext.current = ''
    stream.current?.close()
    setAuthStatus('loading')
    setRefreshing(false)
    authRequest.current = getMe().then(user => {
      if (generation !== authGeneration.current) return
      auth.current = user
      setAuthStatus('authenticated')
      setRole(user.role)
      setProfile(profileFromSession(user, null))
      setError('')
    }).catch(reason => {
      if (generation !== authGeneration.current) return
      auth.current = null
      setRole(null)
      setProfile(null)
      setApplication(null)
      const anonymous = reason instanceof ApiError && reason.status === 401
      setAuthStatus(anonymous ? 'anonymous' : 'unavailable')
      setError(anonymous ? '' : '로그인 상태를 확인하지 못했어요. 다시 시도해 주세요.')
    }).then(() => {
      if (generation === authGeneration.current) {
        authReady.current = true
        setLatestResult(null)
        setSessionRevision(value => value + 1)
      }
    })
    return authRequest.current
  }, [])

  const refreshState = useCallback((includeResults = false): Promise<void> => {
    if (!authReady.current || !mode.current.enabled || mode.current.authOnly || (auth.current && isAdminRole(auth.current.role))) return Promise.resolve()
    queued.current = true
    queuedResults.current ||= includeResults
    if (inFlight.current) return inFlight.current
    const run = async () => {
      while (queued.current && authReady.current && mode.current.enabled && !mode.current.authOnly) {
        queued.current = false
        let loadResults = queuedResults.current
        queuedResults.current = false
        const id = ++requestId.current
        const user = auth.current
        setRefreshing(true)
        try {
          const snapshot = await getMatchSummary()
          const received = performance.now()
          if (id !== requestId.current) continue
          // 접수 시작·마감·신청 변경은 이전 결과의 재참여 가능 여부도 바꿉니다.
          const context = JSON.stringify([snapshot.currentRound.seq, snapshot.currentRound.status, snapshot.my])
          loadResults ||= context !== resultContext.current
          setSummary(user ? snapshot : { ...snapshot, my: null })
          setReceivedAt(received)
          setNow(received)
          const [own, result] = await Promise.allSettled([
            user ? getMyApplication().catch(reason => {
              if (reason instanceof ApiError && reason.status === 404) return null
              throw reason
            }) : Promise.resolve(null),
            user && loadResults && snapshot.my?.lastResult ? getMyMatchResults(snapshot.my.lastResult.roundSeq) : Promise.resolve(null),
          ])
          if (id !== requestId.current) continue
          if ([own, result].some(item => item.status === 'rejected' && item.reason instanceof ApiError && item.reason.status === 401)) {
            clearSession()
            continue
          }
          if (own.status === 'rejected') throw own.reason
          setApplication(own.value)
          setProfile(user ? profileFromSession(user, own.value, snapshot) : null)
          if (loadResults) {
            setLatestResult(result.status === 'fulfilled' ? result.value : null)
            setResultRevision(value => value + 1)
            if (result.status === 'fulfilled') resultContext.current = context
          }
          setError('')
        } catch (reason) {
          if (id === requestId.current) setError(reason instanceof Error ? reason.message : '인스타팅 정보를 불러오지 못했어요.')
        } finally { if (id === requestId.current) setRefreshing(false) }
      }
    }
    inFlight.current = run().finally(() => { inFlight.current = null })
    return inFlight.current
  }, [clearSession])

  const refresh = useCallback(() => refreshState(true), [refreshState])
  const refreshAuth = useCallback(async () => { await authenticate(true) }, [authenticate])
  const cancelRefresh = useCallback(() => { requestId.current++; queued.current = false }, [])

  useEffect(() => {
    const currentMode = { enabled, authOnly }
    mode.current = currentMode
    if (!enabled) return
    let active = true
    void Promise.resolve().then(() => { if (active) void authenticate() })
    return () => { active = false; currentMode.enabled = false; cancelRefresh() }
  }, [enabled, authOnly, authenticate, cancelRefresh])

  useEffect(() => {
    if (!enabled || authOnly || authStatus === 'loading' || authStatus === 'unavailable' || (role && isAdminRole(role))) return
    let active = true
    const start = () => {
      stream.current?.close()
      stream.current = connectMatchEvents(apiUrl('/api/v1/sse/match'), results => { if (active) void refreshState(results) }, () => document.visibilityState === 'visible')
    }
    // 초기 요청은 SSE 연결 실패 시에도 기본 화면을 제공하며 auth/me를 재호출하지 않습니다.
    void refreshState(true)
    start()
    const visible = () => { if (document.visibilityState === 'visible') { void refreshState(true); stream.current?.reconnect() } }
    const leave = () => stream.current?.close()
    const returnToPage = (event: PageTransitionEvent) => { if (event.persisted) { start(); visible() } }
    document.addEventListener('visibilitychange', visible)
    window.addEventListener('pagehide', leave)
    window.addEventListener('pageshow', returnToPage)
    const clock = window.setInterval(() => setNow(performance.now()), 1000)
    return () => {
      active = false
      stream.current?.close()
      clearInterval(clock)
      document.removeEventListener('visibilitychange', visible)
      window.removeEventListener('pagehide', leave)
      window.removeEventListener('pageshow', returnToPage)
    }
  }, [enabled, authOnly, authStatus, role, sessionRevision, refreshState])

  useEffect(() => {
    if (!enabled || authOnly || authStatus === 'loading' || authStatus === 'unavailable' || !summary || (role && isAdminRole(role))) return
    const deadline = matchDeadline(summary)
    if (!deadline || !Number.isFinite(deadline.at)) return
    const remaining = deadline.at - matchServerTime(summary, receivedAt, performance.now())
    const retryAfter = deadlineAttempt.current.key === deadline.key ? Math.max(0, 5000 - (performance.now() - deadlineAttempt.current.at)) : 0
    let active = true
    let timer: ReturnType<typeof setTimeout>
    const check = async () => {
      if (!active) return
      deadlineAttempt.current = { key: deadline.key, at: performance.now() }
      if (document.visibilityState === 'visible') await refreshState(true)
      if (active) timer = setTimeout(check, 5000)
    }
    timer = setTimeout(check, Math.min(2_147_483_647, Math.max(0, remaining, retryAfter)))
    return () => { active = false; clearTimeout(timer) }
  }, [enabled, authOnly, authStatus, summary, receivedAt, role, refreshState])

  return {
    authStatus, role, summary, profile, application, latestResult, resultRevision, error, refreshing, refresh, refreshAuth, clearSession, receivedAt, now,
    canApply: !error && !refreshing && isMatchOpen(summary),
    alreadyApplied: Boolean(summary?.my?.applied || profile?.participations.some(item => item.roundSeq === summary?.currentRound.seq)),
  }
}
