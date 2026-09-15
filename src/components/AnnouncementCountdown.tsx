import { useEffect, useState } from 'react'
import { ANNOUNCEMENT_TIMESTAMP, getCountdown } from '../utils/countdown'

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
    <div className="instating-countdown" role="timer" aria-live="off" aria-label={remaining.ended ? '결과 발표 예정 시간이 되었습니다' : `1차 결과 발표까지 ${units.map(unit => `${unit.value}${unit.label}`).join(' ')}`}>
      <div className="countdown-caption">
        <strong>{remaining.ended ? '발표 예정 시간 도착' : '1차 결과 발표까지'}</strong>
        <time dateTime={new Date(ANNOUNCEMENT_TIMESTAMP).toISOString()}>{announcementLabel}</time>
      </div>
      <div className="countdown-units" aria-hidden="true">
        {units.map(unit => (
          <div className="countdown-unit" key={unit.label}>
            <span className="countdown-number"><b key={unit.value}>{String(unit.value).padStart(2, '0')}</b></span>
            <span className="countdown-label">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
