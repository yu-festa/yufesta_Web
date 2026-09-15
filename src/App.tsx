import { useCallback, useState } from 'react'
import Main from './pages/Main'
import Splash from './pages/Splash'

const App = () => {
  const [showSplash, setShowSplash] = useState(true)
  const completeSplash = useCallback(() => setShowSplash(false), [])

  return (
    <>
      <div inert={showSplash} aria-hidden={showSplash || undefined}>
        <Main />
      </div>
      {showSplash && <Splash onComplete={completeSplash} />}
    </>
  )
}

export default App
