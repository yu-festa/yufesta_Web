import { useEffect, useState } from 'react'
import splashLogo from '../assets/Splah/SplashLogo.png'
import splashBackground from '../assets/Splah/SplashBackground.webp'

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
    themeColor?.setAttribute('content', '#090D35')

    const imagesReady = Promise.allSettled([splashLogo, splashBackground].map(src => {
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
      className={`[background:linear-gradient(180deg,_#090d35,_#272268_65%,_#9271b1)] splash fixed top-0 left-1/2 z-100 h-dvh w-[min(100%,var(--app-max-width))] -translate-x-1/2 overflow-hidden transition-opacity ease-out motion-reduce:transition-none ${isExiting ? 'opacity-0' : 'opacity-100'}`}
      style={{ transitionDuration: `${SPLASH_FADE_MS}ms` }}
      role="status"
      aria-label="YU FESTA 시작 화면"
    >
      <div className={"absolute inset-[0] overflow-hidden pointer-events-none splash-sky"} aria-hidden="true">
        <img className={"block w-full h-full object-cover [object-position:center] select-none splash-background"} src={splashBackground} alt="" fetchPriority="high" draggable={false} />
        <div className={"absolute inset-[0] [background:radial-gradient(ellipse_70%_17%_at_50%_50%,_#090d354d,_transparent),_linear-gradient(180deg,_#090d351a,_transparent_25%,_transparent_80%,_#090d351a)] splash-shade"} />
      </div>
      <div className="absolute inset-x-0 top-[env(safe-area-inset-top,0px)] bottom-[env(safe-area-inset-bottom,0px)] flex items-center justify-center">
        <img className={"[filter:drop-shadow(0_2px_8px_#090d3599)_drop-shadow(0_0_24px_#c8a5ff70)] splash-logo block h-auto max-h-[24%] w-[74%] max-w-[320px] object-contain select-none"} src={splashLogo} width="294" height="98" alt="YU FESTA" fetchPriority="high" draggable={false} />
      </div>
    </div>
  )
}
