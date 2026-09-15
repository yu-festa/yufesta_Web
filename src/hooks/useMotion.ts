import { useEffect, useRef } from 'react'

/** CSS 파일 없이 애니메이션을 재생하고 모션 줄이기 설정 변경도 반영합니다. */
export function useMotion<T extends HTMLElement>(frames: Keyframe[], options: KeyframeAnimationOptions, trigger?: unknown) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animation: Animation | undefined
    const update = () => {
      animation?.cancel()
      if (!preference.matches) animation = element.animate(frames, options)
    }
    update()
    preference.addEventListener('change', update)
    return () => {
      animation?.cancel()
      preference.removeEventListener('change', update)
    }
  }, [frames, options, trigger])

  return ref
}
