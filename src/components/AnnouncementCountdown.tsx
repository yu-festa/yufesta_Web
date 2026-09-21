import { useEffect, useState } from 'react'
import { ANNOUNCEMENT_TIMESTAMP, getCountdown } from '../utils/countdown'
import CountdownDigits from './CountdownDigits'

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
    { label: '시간', displayLabel: '시', value: remaining.hours },
    { label: '분', value: remaining.minutes },
    { label: '초', value: remaining.seconds },
  ]

  return (
    <div className={"mt-[17px] instating-banner-countdown"} role="timer" aria-live="off" aria-label={remaining.ended ? '결과 발표 예정 시간이 되었습니다' : `1차 결과 발표까지 ${units.map(unit => `${unit.value}${unit.label}`).join(' ')}`}>
      <div>
        <span className={"block text-[clamp(24px,calc(3.5cqw_+_10px),22px)] leading-[1.4] font-[650] tracking-[-.4px] instating-banner-countdown-label"}>{remaining.ended ? '발표 예정 시간 도착' : '1차 결과 발표까지'}</span>
        <time className="sr-only" dateTime={new Date(ANNOUNCEMENT_TIMESTAMP).toISOString()}>{announcementLabel}</time>
      </div>
      <CountdownDigits units={units} className="mt-[clamp(23px,7cqw,32px)] instating-banner-digits" />
    </div>
  )
}
