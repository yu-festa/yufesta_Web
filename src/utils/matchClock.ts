import type { MatchSummary } from '../api/match.ts'
import { parseMatchTime } from './match.ts'

// receivedAt과 now에는 performance.now()를 넣어 기기 시계 변경의 영향을 막습니다.
export function matchServerTime(summary: MatchSummary, receivedAt: number, now: number) {
  return parseMatchTime(summary.serverNow) + Math.max(0, now - receivedAt)
}

export function matchDeadline(summary: MatchSummary) {
  const round = summary.currentRound
  const target = round.status === 'SCHEDULED' ? round.openAt : round.status === 'OPEN' ? round.closeAt : round.status === 'CLOSED' ? round.publishAt : summary.nextRound?.openAt
  return target ? { key: `${round.seq}:${round.status}:${target}`, at: parseMatchTime(target) } : null
}
