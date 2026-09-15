// 발표 일정은 한국 시간 기준이며, 이 값만 바꾸면 표시 날짜와 타이머가 함께 바뀝니다.
export const ANNOUNCEMENT_AT = '2026-10-02T11:00:00+09:00'
export const ANNOUNCEMENT_TIMESTAMP = Date.parse(ANNOUNCEMENT_AT)

export function getCountdown(now = Date.now(), target = ANNOUNCEMENT_TIMESTAMP) {
  const totalSeconds = Math.max(0, Math.ceil((target - now) / 1000))
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor(totalSeconds / 3600) % 24,
    minutes: Math.floor(totalSeconds / 60) % 60,
    seconds: totalSeconds % 60,
    ended: totalSeconds === 0,
  }
}
