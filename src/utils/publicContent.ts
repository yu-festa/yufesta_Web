import { parseMatchTime } from './match.ts'

export function formatContentTime(value: string) {
  const time = parseMatchTime(value)
  return Number.isFinite(time) ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(time) : ''
}
