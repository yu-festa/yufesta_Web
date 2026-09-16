import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Main from './pages/Main'
import Splash from './pages/Splash'
import Timetable from './pages/Timetable'
import Cheers from './pages/Cheers'

type Page = 'main' | 'timetable' | 'cheers'

function getPageFromHash(): Page {
  if (window.location.hash === '#timetable') return 'timetable'
  if (window.location.hash === '#cheers') return 'cheers'
  return 'main'
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true)
  const completeSplash = useCallback(() => setShowSplash(false), [])
  const [page, setPage] = useState<Page>(getPageFromHash)
  const mainScrollRef = useRef(0)

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

  function openPage(nextPage: Exclude<Page, 'main'>) {
    mainScrollRef.current = window.scrollY
    window.history.pushState({ ...window.history.state, fromMain: true }, '', `#${nextPage}`)
    setPage(nextPage)
  }

  function closePage() {
    if (window.history.state?.fromMain) window.history.back()
    else {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      setPage('main')
    }
  }

  return (
    <>
      <div inert={showSplash} aria-hidden={showSplash || undefined}>
        {page === 'timetable' && <Timetable onBack={closePage} />}
        {page === 'cheers' && <Cheers onBack={closePage} />}
        {page === 'main' && <Main onOpenTimetable={() => openPage('timetable')} onOpenCheers={() => openPage('cheers')} />}
      </div>
      {showSplash && <Splash onComplete={completeSplash} />}
    </>
  )
}

export default App
