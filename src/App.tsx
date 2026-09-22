import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Main from './pages/Main'
import Splash from './pages/Splash'
import Timetable from './pages/Timetable'
import PerformanceDetail from './pages/PerformanceDetail'
import { performanceDetails } from './data/performanceDetails'
import Cheers from './pages/Cheers'
import LostFound from './pages/LostFound'
import Login from './pages/Login'
import InstatingApply from './pages/InstatingApply'
import Profile from './pages/Profile'
import InstatingResult from './pages/InstatingResult'
import { APPLICATION_STORAGE_KEY, readApplications } from './utils/instating'
import { profileFromApplication, resolveProfileAccess } from './utils/profile'
import type { ProfileUser } from './utils/profile'
import Landing from './pages/Landing'
import { useFestivalOpening } from './hooks/useFestivalOpening'
import { resolveFestivalStart } from './utils/festivalLaunch'
import { getMe, logout } from './api/auth'
import { ApiError } from './api/client'
import { getMatchSummary, getMyApplication } from './api/match'
import type { MatchSummary } from './api/match'

const FestivalMap = lazy(() => import('./pages/FestivalMap'))
const festivalStart = resolveFestivalStart(import.meta.env.DEV ? import.meta.env.VITE_FESTIVAL_START_AT : undefined)
const allowRepeatApplication = import.meta.env.DEV && import.meta.env.VITE_INSTATING_REPEAT_TEST === 'true'
const previewEnabled = import.meta.env.VITE_PROFILE_PREVIEW === 'true'
const SPLASH_SEEN_KEY = 'yufesta:splash-seen'

function shouldShowSplash() {
  try { return sessionStorage.getItem(SPLASH_SEEN_KEY) !== 'true' }
  catch { return true }
}

type Page = 'entry' | 'main' | 'timetable' | 'performance' | 'cheers' | 'map' | 'lost' | 'lost-write' | 'lost-detail' | 'login' | 'instating-apply' | 'profile' | 'instating-result'
type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'unavailable'

function getPageFromHash(): Page {
  if (window.location.hash.startsWith('#lost/post/')) return 'lost-detail'
  if (window.location.hash.startsWith('#performance/')) return 'performance'
  if (window.location.hash.startsWith('#profile/result/')) return 'instating-result'
  if (window.location.hash === '#profile') return 'profile'
  if (window.location.hash === '#instating-apply') return 'instating-apply'
  if (window.location.pathname.replace(/\/$/, '') === '/instating/apply') return 'instating-apply'
  if (window.location.pathname.replace(/\/$/, '') === '/main' && !window.location.hash) return 'main'
  if (window.location.hash === '#timetable') return 'timetable'
  if (window.location.hash === '#cheers') return 'cheers'
  if (window.location.hash === '#map') return 'map'
  if (window.location.hash === '#lost') return 'lost'
  if (window.location.hash === '#lost/write') return 'lost-write'
  if (window.location.hash === '#login') return 'login'
  if (window.location.pathname.replace(/\/$/, '') === '/login') return 'login'
  if (window.location.hash === '#profile') return 'profile'
  return 'entry'
}

function getLostPostId() {
  if (!window.location.hash.startsWith('#lost/post/')) return null
  try { return decodeURIComponent(window.location.hash.slice('#lost/post/'.length)) }
  catch { return '' }
}

const App = () => {
  const [showSplash, setShowSplash] = useState(shouldShowSplash)
  const completeSplash = useCallback(() => setShowSplash(false), [])
  const [requestedPage, setPage] = useState<Page>(getPageFromHash)
  const mainScrollRef = useRef(0)
  const lostScrollRef = useRef(0)
  const [lostPostId, setLostPostId] = useState(getLostPostId)
  const [, refreshApplications] = useState(0)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const [loginRedirect, setLoginRedirect] = useState('/main#profile')
  const [serverProfile, setServerProfile] = useState<ProfileUser | null>(null)
  const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null)
  const festivalOpened = useFestivalOpening(festivalStart)
  const profileAccess = resolveProfileAccess(serverProfile, previewEnabled)
  const alreadyApplied = Boolean(matchSummary?.my?.applied) || readApplications().length > 0 || (profileAccess.user?.participations.some(item => !item.isDemo) ?? false)
  const [resultId, setResultId] = useState(() => window.location.hash.slice('#profile/result/'.length))
  const [performanceId, setPerformanceId] = useState(() => window.location.hash.startsWith('#performance/') ? window.location.hash.slice('#performance/'.length) : '')
  const requiresAuthentication = requestedPage === 'profile' || requestedPage === 'instating-result' || requestedPage === 'instating-apply'
  const page = requestedPage === 'entry' ? (festivalOpened ? 'main' : 'landing') : requiresAuthentication && authStatus !== 'loading' && profileAccess.page === 'login' ? 'login' : requestedPage
  const resolvedLoginRedirect = requestedPage === 'instating-apply' ? '/instating/apply' : loginRedirect

  useEffect(() => {
    if (!showSplash) return
    try { sessionStorage.setItem(SPLASH_SEEN_KEY, 'true') }
    catch { /* 저장소를 사용할 수 없으면 현재 페이지에서만 Splash를 유지한다. */ }
  }, [showSplash])

  useEffect(() => {
    let active = true
    async function loadBackendState() {
      const summary = await getMatchSummary().catch(() => null)
      if (!active) return
      setMatchSummary(summary)

      try {
        await getMe()
        if (!active) return
        setAuthStatus('authenticated')
        let application = null
        if (summary?.my?.applied) {
          try { application = await getMyApplication() }
          catch (error) {
            if (!(error instanceof ApiError && error.code === 'APPLICATION_NOT_FOUND')) throw error
          }
        }
        if (active) setServerProfile(profileFromApplication(application))
      } catch (error) {
        if (!active) return
        setServerProfile(null)
        setAuthStatus(error instanceof ApiError && error.status === 401 ? 'anonymous' : 'unavailable')
      }
    }
    void loadBackendState()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (authStatus !== 'loading' && requiresAuthentication && profileAccess.page === 'login') {
      window.history.replaceState(window.history.state, '', '/#login')
    }
  }, [requestedPage, requiresAuthentication, profileAccess.page, authStatus])

  useEffect(() => {
    const syncPage = () => {
      setPage(getPageFromHash())
      setLostPostId(getLostPostId())
      setResultId(window.location.hash.slice('#profile/result/'.length))
      setPerformanceId(window.location.hash.startsWith('#performance/') ? window.location.hash.slice('#performance/'.length) : '')
    }
    window.addEventListener('popstate', syncPage)
    window.addEventListener('hashchange', syncPage)
    return () => {
      window.removeEventListener('popstate', syncPage)
      window.removeEventListener('hashchange', syncPage)
    }
  }, [])

  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === APPLICATION_STORAGE_KEY || event.key === null) refreshApplications(value => value + 1) }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  useLayoutEffect(() => {
    window.scrollTo(0, page === 'main' ? mainScrollRef.current : page === 'lost' ? lostScrollRef.current : 0)
  }, [page, performanceId, lostPostId])

  function openPage(nextPage: Exclude<Page, 'entry' | 'main' | 'lost-write' | 'lost-detail' | 'performance'>) {
    mainScrollRef.current = window.scrollY
    if (nextPage === 'lost') lostScrollRef.current = 0
    window.history.pushState({ ...window.history.state, fromMain: true }, '', `/main#${nextPage}`)
    setPage(nextPage)
  }

  function closePage() {
    if (window.history.state?.fromMain) window.history.back()
    else {
      window.history.replaceState(null, '', '/main')
      setPage('main')
    }
  }

  function openLogin(redirect = '/main#profile') {
    setLoginRedirect(redirect)
    openPage('login')
  }

  function openPerformance(id: string) {
    mainScrollRef.current = window.scrollY
    const encodedId = encodeURIComponent(id)
    window.history.pushState({ fromMain: true }, '', `/main#performance/${encodedId}`)
    setPerformanceId(encodedId)
    setPage('performance')
  }

  function openResult(id: string) {
    window.history.pushState(null, '', `/main#profile/result/${encodeURIComponent(id)}`)
    setResultId(encodeURIComponent(id))
    setPage('instating-result')
  }

  function openProfile() {
    window.history.pushState(null, '', '/main#profile')
    setPage('profile')
  }

  function goHome() {
    mainScrollRef.current = 0
    if (page !== 'main' || window.location.hash) {
      window.history.pushState(null, '', '/main')
    }
    setPage('main')
    window.scrollTo(0, 0)
  }

  async function signOut() {
    await logout()
    setAuthStatus('anonymous')
    setServerProfile(null)
    setMatchSummary(await getMatchSummary().catch(() => null))
    goHome()
  }

  function openLostWrite() {
    lostScrollRef.current = 0
    window.history.pushState({ fromLost: true }, '', '#lost/write')
    setPage('lost-write')
  }

  function openLostPost(id: string) {
    lostScrollRef.current = window.scrollY
    window.history.pushState({ fromLost: true }, '', `#lost/post/${encodeURIComponent(id)}`)
    setLostPostId(id)
    setPage('lost-detail')
  }

  function closeLostWrite() {
    if (window.history.state?.fromLost) window.history.back()
    else {
      window.history.replaceState(null, '', '#lost')
      setLostPostId(null)
      setPage('lost')
    }
  }

  return (
    <>
      <div inert={showSplash} aria-hidden={showSplash || undefined}>
        {page === 'landing' && <Landing target={festivalStart} />}
        {page === 'timetable' && <Timetable onBack={closePage} onHome={goHome} />}
        {page === 'performance' && <PerformanceDetail performance={performanceDetails.find(item => encodeURIComponent(item.id) === performanceId)} onBack={closePage} onHome={goHome} />}
        {page === 'cheers' && <Cheers onBack={closePage} onHome={goHome} />}
        {page === 'map' && <Suspense fallback={<div className="grid h-dvh place-items-center text-sm text-[#63708a]" role="status">축제 지도를 불러오고 있어요…</div>}><FestivalMap onBack={closePage} /></Suspense>}
        {(page === 'lost' || page === 'lost-write' || page === 'lost-detail') && <LostFound isWriting={page === 'lost-write'} postId={page === 'lost-detail' ? lostPostId : null} onOpenPost={openLostPost} onBack={closePage} onHome={goHome} onWrite={openLostWrite} onBackToList={closeLostWrite} />}
        {page === 'login' && <Login onBack={closePage} onHome={goHome} redirectPath={resolvedLoginRedirect} />}
        {(page === 'profile' || page === 'instating-result' || page === 'instating-apply') && authStatus === 'loading' && <div className="grid min-h-dvh place-items-center text-sm text-[#63708a]" role="status">로그인 상태를 확인하고 있어요…</div>}
        {page === 'profile' && authStatus !== 'loading' && (profileAccess.page === 'profile' ? <Profile user={profileAccess.user} isPreview={profileAccess.isPreview} onBack={closePage} onHome={goHome} onResult={openResult} onApply={() => openPage('instating-apply')} onLogout={authStatus === 'authenticated' ? signOut : undefined} /> : <Login onBack={closePage} onHome={goHome} redirectPath="/main#profile" />)}
        {page === 'instating-result' && authStatus !== 'loading' && profileAccess.page === 'profile' && <InstatingResult key={resultId} participation={profileAccess.user.participations.find(item => encodeURIComponent(item.id) === resultId)} isPreview={profileAccess.isPreview} onClose={openProfile} />}
        {page === 'instating-apply' && authStatus !== 'loading' && profileAccess.page === 'profile' && <InstatingApply onHome={goHome} onProfile={openProfile} alreadyApplied={alreadyApplied} allowRepeat={allowRepeatApplication} />}
        {page === 'main' && <Main onHome={goHome} onOpenTimetable={() => openPage('timetable')} onOpenPerformance={openPerformance} onOpenCheers={() => openPage('cheers')} onOpenMap={() => openPage('map')} onOpenLost={() => openPage('lost')} alreadyApplied={alreadyApplied && !allowRepeatApplication} matchSummary={matchSummary} onApplyInstating={() => authStatus !== 'authenticated' ? openLogin('/instating/apply') : allowRepeatApplication ? openPage('instating-apply') : alreadyApplied ? openProfile() : openPage('instating-apply')} onOpenProfile={() => authStatus === 'loading' ? openPage('profile') : profileAccess.page === 'login' ? openLogin() : openPage('profile')} />}
      </div>
      {showSplash && <Splash onComplete={completeSplash} />}
    </>
  )
}

export default App
