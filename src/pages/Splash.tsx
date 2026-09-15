import { useEffect, useState } from 'react'
import splashLogo from '../assets/Splash/SplashLogo.svg'
import yuIcon from '../assets/Splash/YUICON.svg'

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
      data-testid="splash"
      className={`fixed top-0 left-1/2 z-100 h-dvh w-[min(100%,var(--app-max-width))] -translate-x-1/2 overflow-hidden bg-[linear-gradient(180deg,#2451F5_0%,#376FF7_38.46%,#8BD5FF_100%)] transition-opacity ease-out motion-reduce:transition-none ${isExiting ? 'opacity-0' : 'opacity-100'}`}
      style={{ transitionDuration: `${SPLASH_FADE_MS}ms` }}
      role="status"
      aria-label="YU FESTA 시작 화면"
    >
      <div className="absolute inset-x-0 top-[env(safe-area-inset-top,0px)] bottom-[env(safe-area-inset-bottom,0px)]">
        <img className="absolute top-[32%] left-1/2 block h-auto max-h-[16%] w-[78%] -translate-1/2 object-contain select-none" src={splashLogo} width="294" height="98" alt="YU FESTA" fetchPriority="high" draggable={false} />
        <img className="absolute top-[67.2%] left-1/2 block h-auto max-h-[38%] w-[91%] -translate-1/2 object-contain select-none" src={yuIcon} width="344" height="266" alt="" fetchPriority="high" draggable={false} />
      </div>
    </div>
  )
}
