import { getCountdown } from './countdown.ts'

export const FESTIVAL_START_AT = '2026-10-02T00:00:00+09:00'
export const FESTIVAL_START_TIMESTAMP = Date.parse(FESTIVAL_START_AT)

export function getFestivalCountdown(now = Date.now(), target = FESTIVAL_START_TIMESTAMP) {
  return getCountdown(now, target)
}

export function resolveFestivalHome(now = Date.now(), target = FESTIVAL_START_TIMESTAMP): 'landing' | 'main' {
  return now >= target ? 'main' : 'landing'
}

export function resolveFestivalStart(override?: string) {
  // Require an explicit timezone so a developer's computer timezone cannot change the opening time.
  if (!override || !/(Z|[+-]\d{2}:\d{2})$/.test(override)) return FESTIVAL_START_TIMESTAMP
  const timestamp = Date.parse(override)
  return Number.isFinite(timestamp) ? timestamp : FESTIVAL_START_TIMESTAMP
}
