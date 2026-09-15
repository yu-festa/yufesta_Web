import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import splashLogo from '../assets/Splash/SplashLogo.svg'
import yuIcon from '../assets/Splash/YUICON.svg'
import './Splash.css'

// 이미지가 준비된 뒤 표시할 시간과 사라지는 시간을 한 곳에서 관리합니다.
const SPLASH_HOLD_MS = 1800
const SPLASH_FADE_MS = 400
const IMAGE_WAIT_LIMIT_MS = 4000

type SplashProps = {
  onComplete: () => void
}

export default function Splash({ onComplete }: SplashProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    let cancelled = false
    let holdTimer: ReturnType<typeof setTimeout> | undefined
    let fadeTimer: ReturnType<typeof setTimeout> | undefined
    let imageTimer: ReturnType<typeof setTimeout> | undefined
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const previousThemeColor = themeColor?.content
    themeColor?.setAttribute('content', '#2451F5')

    const imagesReady = Promise.allSettled([splashLogo, yuIcon].map(src => {
      const image = new Image()
      image.src = src
      return image.decode()
    }))
    const imageWaitLimit = new Promise<void>(resolve => {
      imageTimer = setTimeout(resolve, IMAGE_WAIT_LIMIT_MS)
    })

    // 느리거나 실패한 이미지 요청이 Main 진입을 계속 막지 않도록 제한합니다.
    void Promise.race([imagesReady, imageWaitLimit]).then(() => {
      if (cancelled) return
      clearTimeout(imageTimer)
      holdTimer = setTimeout(() => {
        setIsExiting(true)
        fadeTimer = setTimeout(onComplete, SPLASH_FADE_MS)
      }, SPLASH_HOLD_MS)
    })

    return () => {
      cancelled = true
      clearTimeout(imageTimer)
      clearTimeout(holdTimer)
      clearTimeout(fadeTimer)
      if (themeColor && previousThemeColor !== undefined) themeColor.content = previousThemeColor
    }
  }, [onComplete])

  return (
    <div
      className={`splash${isExiting ? ' splash--exiting' : ''}`}
      style={{ '--splash-fade-duration': `${SPLASH_FADE_MS}ms` } as CSSProperties}
      role="status"
      aria-label="YU FESTA 시작 화면"
    >
      <div className="splash-artwork">
        <img className="splash-logo" src={splashLogo} width="294" height="98" alt="YU FESTA" fetchPriority="high" />
        <img className="splash-mascot" src={yuIcon} width="344" height="266" alt="" fetchPriority="high" />
      </div>
    </div>
  )
}
