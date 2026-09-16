import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Main from './pages/Main'
import Splash from './pages/Splash'
import Timetable from './pages/Timetable'

const App = () => {
  const [showSplash, setShowSplash] = useState(true)
  const completeSplash = useCallback(() => setShowSplash(false), [])
  const [showTimetable, setShowTimetable] = useState(() => window.location.hash === '#timetable')
  const mainScrollRef = useRef(0)

  useEffect(() => {
    const syncPage = () => setShowTimetable(window.location.hash === '#timetable')
    window.addEventListener('popstate', syncPage)
    window.addEventListener('hashchange', syncPage)
    return () => {
      window.removeEventListener('popstate', syncPage)
      window.removeEventListener('hashchange', syncPage)
    }
  }, [])

  useLayoutEffect(() => {
    window.scrollTo(0, showTimetable ? 0 : mainScrollRef.current)
  }, [showTimetable])

  function openTimetable() {
    mainScrollRef.current = window.scrollY
    window.history.pushState({ ...window.history.state, fromMain: true }, '', '#timetable')
    setShowTimetable(true)
  }

  function closeTimetable() {
    if (window.history.state?.fromMain) window.history.back()
    else {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      setShowTimetable(false)
    }
  }

  return (
    <>
      <div inert={showSplash} aria-hidden={showSplash || undefined}>
        {showTimetable ? <Timetable onBack={closeTimetable} /> : <Main onOpenTimetable={openTimetable} />}
      </div>
      {showSplash && <Splash onComplete={completeSplash} />}
    </>
  )
}

export default App
