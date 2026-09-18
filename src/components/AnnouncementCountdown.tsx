import { useEffect, useState } from 'react'
import { ANNOUNCEMENT_TIMESTAMP, getCountdown } from '../utils/countdown'
import { useMotion } from '../hooks/useMotion'

const digitFrames = [
  { opacity: .3, transform: 'translateY(-5px) rotateX(55deg)' },
  { opacity: 1, transform: 'translateY(0) rotateX(0)' },
]
const digitTiming = { duration: 380, easing: 'cubic-bezier(.2, .7, .3, 1)' }

function AnimatedNumber({ value }: { value: number }) {
  const ref = useMotion<HTMLElement>(digitFrames, digitTiming, value)
  return <span ref={ref} className={"block text-[clamp(30px,_10.5cqw,_48px)] font-[750] leading-[1.1] tracking-[-1.3px] tabular-nums instating-banner-number"}>{String(value).padStart(2, '0')}</span>
}

const announcementLabel = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
}).format(ANNOUNCEMENT_TIMESTAMP)

export default function AnnouncementCountdown() {
  const [remaining, setRemaining] = useState(() => getCountdown())

  useEffect(() => {
    function update() {
      const next = getCountdown()
      setRemaining(next)
      if (next.ended) clearInterval(timer)
    }
    const timer = setInterval(update, 1000)
    // 백그라운드에서 돌아올 때 실제 시각을 기준으로 즉시 보정합니다.
    document.addEventListener('visibilitychange', update)
    update()
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  const units = [
    { label: '일', value: remaining.days },
    { label: '시간', value: remaining.hours },
    { label: '분', value: remaining.minutes },
    { label: '초', value: remaining.seconds },
  ]

  return (
    <div className={"mt-[17px] instating-banner-countdown"} role="timer" aria-live="off" aria-label={remaining.ended ? '결과 발표 예정 시간이 되었습니다' : `1차 결과 발표까지 ${units.map(unit => `${unit.value}${unit.label}`).join(' ')}`}>
      <div>
        <span className={"block text-[clamp(14px,_3.5cqw,_17px)] leading-[1.4] font-[750] tracking-[-.4px] instating-banner-countdown-label"}>{remaining.ended ? '발표 예정 시간 도착' : '1차 결과 발표까지'}</span>
        <time className="sr-only" dateTime={new Date(ANNOUNCEMENT_TIMESTAMP).toISOString()}>{announcementLabel}</time>
      </div>
      <div className={"flex items-baseline justify-between gap-[8px] mt-[clamp(23px,_7cqw,_32px)] [@container(max-width:_320px)]:gap-[5px] instating-banner-digits"} aria-hidden="true">
        {units.map(unit => (
          <div className={"flex min-w-[0] items-baseline gap-[6px] [@container(max-width:_320px)]:gap-[3px] instating-banner-unit"} data-testid="countdown-unit" key={unit.label}>
            <span className={"block perspective-[180px] instating-banner-number-window"}><AnimatedNumber value={unit.value} /></span>
            <span className={"text-[clamp(11px,_3cqw,_14px)] font-normal whitespace-nowrap instating-banner-unit-label"}>{unit.label === '시간' ? '시' : unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
