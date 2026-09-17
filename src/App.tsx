import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Main from './pages/Main'
import Splash from './pages/Splash'
import Timetable from './pages/Timetable'
import Cheers from './pages/Cheers'
import LostFound from './pages/LostFound'
import Login from './pages/Login'
import InstatingApply from './pages/InstatingApply'
import Profile from './pages/Profile'
import { getCurrentProfileUser, resolveProfileAccess } from './utils/profile'

const FestivalMap = lazy(() => import('./pages/FestivalMap'))

type Page = 'main' | 'timetable' | 'cheers' | 'map' | 'lost' | 'lost-write' | 'login' | 'instating-apply' | 'profile'

function getPageFromHash(): Page {
  if (window.location.pathname.replace(/\/$/, '') === '/instating/apply') return 'instating-apply'
  if (window.location.hash === '#timetable') return 'timetable'
  if (window.location.hash === '#cheers') return 'cheers'
  if (window.location.hash === '#map') return 'map'
  if (window.location.hash === '#lost') return 'lost'
  if (window.location.hash === '#lost/write') return 'lost-write'
  if (window.location.hash === '#login') return 'login'
  if (window.location.hash === '#profile') return 'profile'
  return 'main'
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true)
  const completeSplash = useCallback(() => setShowSplash(false), [])
  const [requestedPage, setPage] = useState<Page>(getPageFromHash)
  const mainScrollRef = useRef(0)
  const profileAccess = resolveProfileAccess(getCurrentProfileUser(), import.meta.env.VITE_PROFILE_PREVIEW !== 'false')
  const page = requestedPage === 'profile' && profileAccess.page === 'login' ? 'login' : requestedPage

  useEffect(() => {
    if (requestedPage === 'profile' && profileAccess.page === 'login') {
      window.history.replaceState(window.history.state, '', '/#login')
    }
  }, [requestedPage, profileAccess.page])

  useEffect(() => {
    const syncPage = () => setPage(getPageFromHash())
    window.addEventListener('popstate', syncPage)
    window.addEventListener('hashchange', syncPage)
    return () => {
      window.removeEventListener('popstate', syncPage)
      window.removeEventListener('hashchange', syncPage)
    }
  }, [])

  useLayoutEffect(() => {
    window.scrollTo(0, page === 'main' ? mainScrollRef.current : 0)
  }, [page])

  function openPage(nextPage: Exclude<Page, 'main' | 'lost-write'>) {
    mainScrollRef.current = window.scrollY
    window.history.pushState({ ...window.history.state, fromMain: true }, '', `#${nextPage}`)
    setPage(nextPage)
  }

  function closePage() {
    if (window.history.state?.fromMain) window.history.back()
    else {
      window.history.replaceState(null, '', '/')
      setPage('main')
    }
  }

  function goHome() {
    mainScrollRef.current = 0
    if (page !== 'main' || window.location.hash) {
      window.history.pushState(null, '', '/')
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
        {page === 'timetable' && <Timetable onBack={closePage} onHome={goHome} />}
        {page === 'cheers' && <Cheers onBack={closePage} onHome={goHome} />}
        {page === 'map' && <Suspense fallback={<div className="grid h-dvh place-items-center text-sm text-[#63708a]" role="status">축제 지도를 불러오고 있어요…</div>}><FestivalMap onBack={closePage} /></Suspense>}
        {(page === 'lost' || page === 'lost-write') && <LostFound isWriting={page === 'lost-write'} onBack={closePage} onHome={goHome} onWrite={openLostWrite} onBackToList={closeLostWrite} />}
        {page === 'login' && <Login onBack={closePage} onHome={goHome} />}
        {page === 'profile' && (profileAccess.page === 'profile' ? <Profile user={profileAccess.user} isPreview={profileAccess.isPreview} onBack={closePage} onHome={goHome} /> : <Login onBack={closePage} onHome={goHome} />)}
        {page === 'instating-apply' && <InstatingApply onHome={goHome} />}
        {page === 'main' && <Main onHome={goHome} onOpenTimetable={() => openPage('timetable')} onOpenCheers={() => openPage('cheers')} onOpenMap={() => openPage('map')} onOpenLost={() => openPage('lost')} onApplyInstating={() => openPage('login')} onOpenProfile={() => openPage(profileAccess.page)} />}
      </div>
      {showSplash && <Splash onComplete={completeSplash} />}
    </>
  )
}

export default App
