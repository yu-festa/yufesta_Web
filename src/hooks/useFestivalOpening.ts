import { useEffect, useState } from 'react'
import { resolveFestivalHome } from '../utils/festivalLaunch'

export function useFestivalOpening(target: number) {
  const [opened, setOpened] = useState(() => resolveFestivalHome(Date.now(), target) === 'main')

  useEffect(() => {
    if (opened) return
    let timer: ReturnType<typeof setTimeout>
    function check() {
      clearTimeout(timer)
      const remaining = target - Date.now()
      if (remaining <= 0) setOpened(true)
      else timer = setTimeout(check, Math.min(remaining, 60_000))
    }
    check()
    window.addEventListener('focus', check)
    window.addEventListener('pageshow', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', check)
      window.removeEventListener('pageshow', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [opened, target])

  return opened
}
