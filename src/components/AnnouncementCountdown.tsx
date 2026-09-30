import { useEffect, useState } from 'react'
import { getCountdown } from '../utils/countdown'
import { parseMatchTime } from '../utils/match'
import CountdownDigits from './CountdownDigits'

export default function AnnouncementCountdown({ publishAt, serverNow, roundSeq = 1, receivedAt }: { publishAt?: string; serverNow?: string; roundSeq?: number; receivedAt?: number }) {
  const [now, setNow] = useState(() => performance.now())
  const target = publishAt ? parseMatchTime(publishAt) : NaN
  const server = serverNow ? parseMatchTime(serverNow) : NaN
  const ready = Number.isFinite(target) && Number.isFinite(server) && receivedAt !== undefined
  const remaining = getCountdown(ready ? server + Math.max(0, now - receivedAt) : 0, ready ? target : 0)

  useEffect(() => {
    if (!ready) return
    const update = () => setNow(performance.now())
    const timer = setInterval(update, 1000)
    document.addEventListener('visibilitychange', update)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update) }
  }, [ready])

  if (!ready) return <p className="mt-[17px] text-sm" role="status">발표 시간을 확인하고 있어요.</p>
  const units = [
    { label: '시간', displayLabel: '시', value: remaining.days * 24 + remaining.hours },
    { label: '분', value: remaining.minutes },
    { label: '초', value: remaining.seconds },
  ]
  return (
    <div className="mt-[17px] instating-banner-countdown" role="timer" aria-live="off" aria-label={remaining.ended ? '결과 발표 예정 시간이 되었습니다' : `${roundSeq}차 결과 발표까지 ${units.map(unit => `${unit.value}${unit.label}`).join(' ')}`}>
      <div>
        <span className="block text-[clamp(24px,calc(3.5cqw_+_10px),22px)] leading-[1.4] font-[650] tracking-[-.4px] instating-banner-countdown-label">{remaining.ended ? '발표 예정 시간 도착' : `${roundSeq}차 결과 발표까지`}</span>
        <time className="sr-only" dateTime={new Date(target).toISOString()}>{new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(target)}</time>
      </div>
      <CountdownDigits units={units} className="mt-[clamp(23px,7cqw,32px)] instating-banner-digits" />
    </div>
  )
}
