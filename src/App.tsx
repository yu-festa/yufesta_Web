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
import { resolveProfileAccess } from './utils/profile'
import Landing from './pages/Landing'
import { useFestivalOpening } from './hooks/useFestivalOpening'
import { resolveFestivalStart } from './utils/festivalLaunch'
import { markSplashSeen, shouldShowSplash } from './utils/splash'
import { logout } from './api/auth'
import { useMatchState } from './hooks/useMatchState'
import MapLoadBoundary from './components/MapLoadBoundary'
import AdminMain from './pages/AdminMain'
import { isAdminRole, loginDestination } from './utils/admin'

const FestivalMap = lazy(() => import('./pages/FestivalMap'))
const festivalStart = resolveFestivalStart(import.meta.env.DEV ? import.meta.env.VITE_FESTIVAL_START_AT : undefined)
const previewEnabled = import.meta.env.VITE_PROFILE_PREVIEW === 'true'

type Page = 'entry' | 'main' | 'admin' | 'timetable' | 'performance' | 'cheers' | 'map' | 'lost' | 'lost-write' | 'lost-detail' | 'login' | 'instating-apply' | 'profile' | 'instating-result'

function getPageFromHash(): Page {
  if (window.location.pathname.replace(/\/$/, '') === '/admin') return 'admin'
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
  const festivalOpened = useFestivalOpening(festivalStart)
  const needsMatchState = requestedPage === 'entry' ? festivalOpened : ['main', 'admin', 'profile', 'instating-result', 'instating-apply', 'login'].includes(requestedPage)
  const { authStatus, role, summary: matchSummary, profile: serverProfile, alreadyApplied, canApply, error: matchError, refreshing, refresh, clearSession, receivedAt } = useMatchState(needsMatchState, requestedPage === 'admin')
  const profileAccess = resolveProfileAccess(serverProfile, previewEnabled)
  const [resultId, setResultId] = useState(() => window.location.hash.slice('#profile/result/'.length))
  const [performanceId, setPerformanceId] = useState(() => window.location.hash.startsWith('#performance/') ? window.location.hash.slice('#performance/'.length) : '')
  const requiresAuthentication = requestedPage === 'profile' || requestedPage === 'instating-result' || requestedPage === 'instating-apply' || requestedPage === 'admin'
  const authenticatedLogin = requestedPage === 'login' && authStatus === 'authenticated' && !new URLSearchParams(window.location.search).has('error')
  const adminRole = authStatus === 'authenticated' && isAdminRole(role) ? role : null
  const adminEntry = !!adminRole && (authenticatedLogin || ['main', 'profile', 'instating-result', 'instating-apply'].includes(requestedPage) || (requestedPage === 'entry' && festivalOpened))
  const page = adminEntry ? 'admin' : authenticatedLogin ? 'main' : requestedPage === 'entry' ? (festivalOpened ? 'main' : 'landing') : requiresAuthentication && authStatus === 'anonymous' && (requestedPage === 'admin' || profileAccess.page === 'login') ? 'login' : requestedPage
  const handleAdminAuthError = useCallback((status: number) => {
    if (status === 401) clearSession()
    else void refresh()
  }, [clearSession, refresh])

  useEffect(() => {
    // 루트 진입은 로그인 여부가 아니라 축제 시작 시각으로만 결정합니다.
    // 시작 시각이 지나면 뒤로 가기로 랜딩에 돌아오지 않도록 주소도 교체합니다.
    if (requestedPage === 'entry' && festivalOpened) {
      window.history.replaceState(window.history.state, '', `/main${window.location.search}`)
    }
  }, [requestedPage, festivalOpened])

  useEffect(() => {
    if (adminEntry || authenticatedLogin) {
      window.history.replaceState(null, '', loginDestination(role))
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [adminEntry, authenticatedLogin, role])

  useEffect(() => { markSplashSeen() }, [])

  useEffect(() => {
    if (authStatus === 'anonymous' && requiresAuthentication && (requestedPage === 'admin' || profileAccess.page === 'login')) {
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

  function openLogin() {
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
    clearSession()
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
        {needsMatchState && matchError && <div className="mx-auto max-w-[480px] bg-red-50 px-5 py-3 text-sm text-red-800" role="alert">{matchError}<button type="button" className="ml-3 underline disabled:opacity-50" disabled={refreshing} onClick={() => void refresh()}>다시 불러오기</button></div>}
        {page === 'landing' && <Landing target={festivalStart} />}
        {page === 'timetable' && <Timetable onBack={closePage} onHome={goHome} />}
        {page === 'performance' && <PerformanceDetail performance={performanceDetails.find(item => encodeURIComponent(item.id) === performanceId)} onBack={closePage} onHome={goHome} />}
        {page === 'cheers' && <Cheers onBack={closePage} onHome={goHome} />}
        {page === 'map' && <MapLoadBoundary onBack={closePage}><Suspense fallback={<div className="grid h-dvh place-items-center text-sm text-[#63708a]" role="status">축제 지도를 불러오고 있어요…</div>}><FestivalMap onBack={closePage} /></Suspense></MapLoadBoundary>}
        {(page === 'lost' || page === 'lost-write' || page === 'lost-detail') && <LostFound isWriting={page === 'lost-write'} postId={page === 'lost-detail' ? lostPostId : null} onOpenPost={openLostPost} onBack={closePage} onHome={goHome} onWrite={openLostWrite} onBackToList={closeLostWrite} />}
        {requiresAuthentication && authStatus === 'unavailable' && !profileAccess.isPreview && <p className="mx-auto max-w-[480px] px-5 py-20 text-center text-sm text-[#63708a]">서버 연결을 확인한 후 다시 불러와 주세요.</p>}
        {page === 'login' && <Login onBack={closePage} onHome={goHome} />}
        {(page === 'main' || page === 'admin' || page === 'profile' || page === 'instating-result' || page === 'instating-apply') && authStatus === 'loading' && <div className="grid min-h-dvh place-items-center text-sm text-[#63708a]" role="status">로그인 상태를 확인하고 있어요…</div>}
        {page === 'admin' && adminRole && <AdminMain role={adminRole} onLogout={signOut} onAuthError={handleAdminAuthError} onRefreshAuth={refresh} />}
        {page === 'admin' && authStatus === 'authenticated' && !adminRole && <section className="mx-auto max-w-[480px] px-6 py-20 text-center"><h1 className="text-xl font-bold">운영자 전용 페이지입니다.</h1><p className="my-5 text-sm text-[#63708a]">이 계정에는 운영자 권한이 없어요. 등록된 운영자 계정으로 로그인해 주세요.</p><button className="rounded-xl bg-[#1554ff] px-6 py-3 text-white" onClick={goHome}>메인으로 돌아가기</button></section>}
        {page === 'profile' && (authStatus === 'authenticated' || profileAccess.isPreview) && (profileAccess.page === 'profile' ? <Profile user={profileAccess.user} isPreview={profileAccess.isPreview} onBack={closePage} onHome={goHome} onResult={openResult} onApply={() => openPage('instating-apply')} onLogout={authStatus === 'authenticated' ? signOut : undefined} matchSummary={matchSummary} alreadyApplied={alreadyApplied} canApply={canApply} onChanged={refresh} /> : <Login onBack={closePage} onHome={goHome} />)}
        {page === 'instating-result' && authStatus !== 'loading' && profileAccess.page === 'profile' && <InstatingResult key={resultId} participation={profileAccess.user.participations.find(item => encodeURIComponent(item.id) === resultId)} isPreview={profileAccess.isPreview} onClose={openProfile} onChanged={refresh} />}
        {page === 'instating-apply' && authStatus !== 'loading' && profileAccess.page === 'profile' && <InstatingApply onHome={goHome} onProfile={openProfile} alreadyApplied={alreadyApplied} canApply={canApply} onSubmitted={refresh} publishAt={matchSummary?.currentRound.publishAt} />}
        {page === 'main' && authStatus !== 'loading' && <Main onHome={goHome} onOpenTimetable={() => openPage('timetable')} onOpenPerformance={openPerformance} onOpenCheers={() => openPage('cheers')} onOpenMap={() => openPage('map')} onOpenLost={() => openPage('lost')} alreadyApplied={alreadyApplied} canApply={canApply} matchSummary={matchSummary} receivedAt={receivedAt} onApplyInstating={() => authStatus !== 'authenticated' ? openLogin() : alreadyApplied ? openProfile() : openPage('instating-apply')} onOpenProfile={() => profileAccess.page === 'login' ? openLogin() : openPage('profile')} />}
      </div>
      {showSplash && <Splash onComplete={completeSplash} />}
    </>
  )
}

export default App
