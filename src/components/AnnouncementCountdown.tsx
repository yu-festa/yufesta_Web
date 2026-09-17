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
  return <span ref={ref} className="block py-0.5 text-[clamp(17px,5.2cqw,24px)] leading-[1.3] font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
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
    <div className="instating-banner__countdown mt-3 grid min-h-16 w-full grid-cols-[minmax(0,.7fr)_minmax(0,1.65fr)] items-center gap-2 rounded-[9px] px-2.5 py-2 @max-[320px]:grid-cols-[minmax(0,.6fr)_minmax(0,1.75fr)] @max-[320px]:gap-1.5 @max-[320px]:px-2" role="timer" aria-live="off" aria-label={remaining.ended ? '결과 발표 예정 시간이 되었습니다' : `1차 결과 발표까지 ${units.map(unit => `${unit.value}${unit.label}`).join(' ')}`}>
      <div>
        <span className="block text-[12px] leading-normal font-semibold break-keep">{remaining.ended ? '발표 예정 시간 도착' : '1차 결과 발표까지'}</span>
        <time className="mt-1 block text-[8px] leading-normal text-[#ede1fa]" dateTime={new Date(ANNOUNCEMENT_TIMESTAMP).toISOString()}>{announcementLabel}</time>
      </div>
      <div className="flex items-center justify-between gap-1 border-l border-white/20 pl-2 @max-[320px]:gap-0.5 @max-[320px]:pl-1.5" aria-hidden="true">
        {units.map(unit => (
          <div className="flex shrink-0 items-end gap-0.5" data-testid="countdown-unit" key={unit.label}>
            <span className="block overflow-hidden perspective-[180px]"><AnimatedNumber value={unit.value} /></span>
            <span className="pb-1 text-[10px] leading-snug whitespace-nowrap text-[#ede1fa]">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
