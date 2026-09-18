import { useEffect, useRef } from 'react'

/** CSS 파일 없이 애니메이션을 재생하고 모션 줄이기 설정 변경도 반영합니다. */
export function useMotion<T extends HTMLElement>(frames: Keyframe[], options: KeyframeAnimationOptions, trigger?: unknown, paused = false) {
  const ref = useRef<T>(null)
  const animationRef = useRef<Animation | undefined>(undefined)
  const pausedRef = useRef(paused)

  useEffect(() => {
    pausedRef.current = paused
    if (paused) animationRef.current?.pause()
    else animationRef.current?.play()
  }, [paused])

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animation: Animation | undefined
    const update = () => {
      animation?.cancel()
      animation = undefined
      if (!preference.matches) {
        animation = element.animate(frames, options)
        if (pausedRef.current) animation.pause()
      }
      animationRef.current = animation
    }
    update()
    preference.addEventListener('change', update)
    return () => {
      animation?.cancel()
      animationRef.current = undefined
      preference.removeEventListener('change', update)
    }
  }, [frames, options, trigger])

  return ref
}
