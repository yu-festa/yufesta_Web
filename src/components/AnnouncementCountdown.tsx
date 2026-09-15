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
  return <span ref={ref} className="block py-0.5 text-[clamp(15px,4.5cqw,20px)] leading-[1.3] font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
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
    <div className="mt-3 grid min-h-16 w-[min(100%,340px)] grid-cols-[minmax(0,.95fr)_minmax(0,1.4fr)] items-center gap-2 rounded-[9px] border border-[#c4ddff66] bg-[linear-gradient(115deg,#1644b94d,#ffffff24)] px-2.5 py-2 shadow-[inset_0_1px_0_#ffffff55,inset_0_-1px_0_#1538a02b,0_5px_12px_#0e329d26] backdrop-blur-md @max-[320px]:gap-1.5 @max-[320px]:px-2" role="timer" aria-live="off" aria-label={remaining.ended ? '결과 발표 예정 시간이 되었습니다' : `1차 결과 발표까지 ${units.map(unit => `${unit.value}${unit.label}`).join(' ')}`}>
      <div>
        <span className="block text-xs leading-normal font-semibold break-keep">{remaining.ended ? '발표 예정 시간 도착' : '1차 결과 발표까지'}</span>
        <time className="mt-1 block text-[10px] leading-normal text-[#e2edff]" dateTime={new Date(ANNOUNCEMENT_TIMESTAMP).toISOString()}>{announcementLabel}</time>
      </div>
      <div className="grid grid-cols-4 gap-1 border-l border-white/20 pl-2 @max-[320px]:gap-0.5 @max-[320px]:pl-1.5" aria-hidden="true">
        {units.map(unit => (
          <div className="min-w-0 text-center" data-testid="countdown-unit" key={unit.label}>
            <span className="block overflow-hidden rounded bg-white/6 shadow-[inset_0_1px_0_#ffffff21] perspective-[180px]"><AnimatedNumber value={unit.value} /></span>
            <span className="mt-0.5 block text-[10px] leading-snug text-[#e2edff]">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
