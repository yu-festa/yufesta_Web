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
import { getCurrentProfileUser, resolveProfileAccess } from './utils/profile'
import Landing from './pages/Landing'
import { useFestivalOpening } from './hooks/useFestivalOpening'
import { resolveFestivalStart } from './utils/festivalLaunch'

const FestivalMap = lazy(() => import('./pages/FestivalMap'))
const festivalStart = resolveFestivalStart(import.meta.env.DEV ? import.meta.env.VITE_FESTIVAL_START_AT : undefined)
const allowRepeatApplication = import.meta.env.DEV && import.meta.env.VITE_INSTATING_REPEAT_TEST === 'true'

type Page = 'entry' | 'main' | 'timetable' | 'performance' | 'cheers' | 'map' | 'lost' | 'lost-write' | 'login' | 'instating-apply' | 'profile' | 'instating-result'

function getPageFromHash(): Page {
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
  if (window.location.hash === '#profile') return 'profile'
  return 'entry'
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true)
  const completeSplash = useCallback(() => setShowSplash(false), [])
  const [requestedPage, setPage] = useState<Page>(getPageFromHash)
  const mainScrollRef = useRef(0)
  const [, refreshApplications] = useState(0)
  const festivalOpened = useFestivalOpening(festivalStart)
  const profileAccess = resolveProfileAccess(getCurrentProfileUser(), import.meta.env.VITE_PROFILE_PREVIEW !== 'false')
  const alreadyApplied = readApplications().length > 0 || (profileAccess.user?.participations.some(item => !item.isDemo) ?? false)
  const [resultId, setResultId] = useState(() => window.location.hash.slice('#profile/result/'.length))
  const [performanceId, setPerformanceId] = useState(() => window.location.hash.startsWith('#performance/') ? window.location.hash.slice('#performance/'.length) : '')
  const page = requestedPage === 'entry' ? (festivalOpened ? 'main' : 'landing') : (requestedPage === 'profile' || requestedPage === 'instating-result') && profileAccess.page === 'login' ? 'login' : requestedPage

  useEffect(() => {
    if ((requestedPage === 'profile' || requestedPage === 'instating-result') && profileAccess.page === 'login') {
      window.history.replaceState(window.history.state, '', '/#login')
    }
  }, [requestedPage, profileAccess.page])

  useEffect(() => {
    const syncPage = () => {
      setPage(getPageFromHash())
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
    window.scrollTo(0, page === 'main' ? mainScrollRef.current : 0)
  }, [page, performanceId])

  function openPage(nextPage: Exclude<Page, 'entry' | 'main' | 'lost-write' | 'performance'>) {
    mainScrollRef.current = window.scrollY
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

  function openLostWrite() {
    window.history.pushState({ fromLost: true }, '', '#lost/write')
    setPage('lost-write')
  }

  function closeLostWrite() {
    if (window.history.state?.fromLost) window.history.back()
    else {
      window.history.replaceState(null, '', '#lost')
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
        {(page === 'lost' || page === 'lost-write') && <LostFound isWriting={page === 'lost-write'} onBack={closePage} onHome={goHome} onWrite={openLostWrite} onBackToList={closeLostWrite} />}
        {page === 'login' && <Login onBack={closePage} onHome={goHome} />}
        {page === 'profile' && (profileAccess.page === 'profile' ? <Profile user={profileAccess.user} isPreview={profileAccess.isPreview} onBack={closePage} onHome={goHome} onResult={openResult} onApply={() => openPage('instating-apply')} /> : <Login onBack={closePage} onHome={goHome} />)}
        {page === 'instating-result' && profileAccess.page === 'profile' && <InstatingResult key={resultId} participation={profileAccess.user.participations.find(item => encodeURIComponent(item.id) === resultId)} isPreview={profileAccess.isPreview} onClose={openProfile} />}
        {page === 'instating-apply' && <InstatingApply onHome={goHome} onProfile={openProfile} alreadyApplied={alreadyApplied} allowRepeat={allowRepeatApplication} />}
        {page === 'main' && <Main onHome={goHome} onOpenTimetable={() => openPage('timetable')} onOpenPerformance={openPerformance} onOpenCheers={() => openPage('cheers')} onOpenMap={() => openPage('map')} onOpenLost={() => openPage('lost')} alreadyApplied={alreadyApplied && !allowRepeatApplication} onApplyInstating={() => allowRepeatApplication ? openPage('instating-apply') : alreadyApplied ? openProfile() : openPage('login')} onOpenProfile={() => openPage(profileAccess.page)} />}
      </div>
      {showSplash && <Splash onComplete={completeSplash} />}
    </>
  )
}

export default App
