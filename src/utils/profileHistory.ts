import { ApiError } from '../api/client.ts'
import { getMyMatchResults } from '../api/match.ts'
import type { MatchApplication, MatchRound, MatchSummary } from '../api/match.ts'
import type { InstatingParticipation } from './profile.ts'
import { parseMatchTime } from './match.ts'
import { toMatchResult } from './matchResult.ts'
import type { ResultView } from './matchResult.ts'

export type ProfileRoundCard = {
  participation: InstatingParticipation
  round?: MatchRound
  application?: MatchApplication
  status: 'pending' | 'matched' | 'unmatched' | 'published'
  highlighted: boolean
}

// 결과 API는 회차를 지정할 수 있지만, 신청 API는 현재 회차만 제공합니다.
export async function getProfileResultHistory(lastRoundSeq?: number): Promise<ResultView[]> {
  if (lastRoundSeq === undefined) return []
  if (!Number.isSafeInteger(lastRoundSeq) || lastRoundSeq < 1 || lastRoundSeq > 50) throw new Error('발표 회차 정보를 확인하지 못했어요.')
  const results: ResultView[] = []
  for (let roundSeq = 1; roundSeq <= lastRoundSeq; roundSeq++) {
    try {
      const result = toMatchResult(await getMyMatchResults(roundSeq))
      if (result.roundSeq !== roundSeq) throw new Error('요청한 회차와 결과 회차가 달라요. 다시 조회해 주세요.')
      results.push(result)
    } catch (reason) {
      // 참여하지 않은 회차는 목록에서 제외합니다. 인증·네트워크 오류는 재시도합니다.
      if (!(reason instanceof ApiError && reason.status === 404 && reason.code === 'APPLICATION_NOT_FOUND')) throw reason
    }
  }
  return results
}

export function resultParticipation(roundSeq: number): InstatingParticipation {
  return { id: `result-round-${roundSeq}`, roundSeq, round: `${roundSeq}차`, festival: '2026 영남대학교 가을축제', nickname: '', interests: [], published: true, resultOnly: true }
}

export function resolveResultParticipation(participations: InstatingParticipation[], id: string) {
  const existing = participations.find(item => encodeURIComponent(item.id) === id)
  if (existing) return existing
  const match = /^result-round-([1-9]\d*)$/.exec(id)
  // 주소는 조회할 회차만 지정합니다. 실제 참여 여부와 공개 여부는 결과 API가 검사합니다.
  return match && Number.isSafeInteger(Number(match[1])) ? resultParticipation(Number(match[1])) : undefined
}

export function buildProfileRoundCards(participations: InstatingParticipation[], application: MatchApplication | null | undefined, summary: MatchSummary | null | undefined, results: ResultView[]): ProfileRoundCard[] {
  const byRound = new Map(participations.map(item => [item.roundSeq ?? item.id, item]))
  for (const result of results) if (!byRound.has(result.roundSeq)) byRound.set(result.roundSeq, resultParticipation(result.roundSeq))
  const newestResult = Math.max(0, summary?.my?.lastResult?.roundSeq ?? 0, ...results.map(result => result.roundSeq))
  return [...byRound.values()].sort((a, b) => (a.roundSeq ?? 0) - (b.roundSeq ?? 0)).map(participation => {
    const roundSeq = participation.roundSeq
    const round = [summary?.currentRound, summary?.nextRound].find(item => item && item.seq === roundSeq) ?? undefined
    const result = results.find(item => item.roundSeq === roundSeq)?.result
    const lastResult = summary?.my?.lastResult?.roundSeq === roundSeq ? summary?.my?.lastResult : null
    const status = result?.status ?? (lastResult ? lastResult.status === 'MATCHED' ? 'matched' : 'unmatched' : participation.result?.status !== 'pending' ? participation.result?.status : undefined) ?? (participation.published ? 'published' : 'pending')
    return { participation, round, application: application && application.roundSeq === roundSeq ? application : undefined, status, highlighted: status === 'matched' && (participation.isDemo === true || roundSeq === newestResult) }
  })
}

export function profileServerNow(summary: MatchSummary | null | undefined, receivedAt: number, now: number) {
  return summary ? parseMatchTime(summary.serverNow) + Math.max(0, now - receivedAt) : NaN
}

export function matchClock(value: string) {
  const timestamp = parseMatchTime(value)
  return Number.isFinite(timestamp) ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' }).format(timestamp) : '시간 확인 중'
}

export function publicationMessage(publishAt: string, now: number) {
  const timestamp = parseMatchTime(publishAt)
  if (!Number.isFinite(timestamp) || !Number.isFinite(now)) return '결과 발표 시간을 확인하고 있어요'
  if (now >= timestamp) return '결과 발표를 준비하고 있어요'
  const day = (time: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(time)
  const date = day(now) === day(timestamp) ? '오늘' : new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }).format(timestamp)
  return `결과는 ${date} ${matchClock(publishAt)}에 열려요`
}

export function closeTimeRemaining(closeAt: string, now: number) {
  const difference = parseMatchTime(closeAt) - now
  if (!Number.isFinite(difference)) return '시간 확인 중'
  if (difference <= 0) return '접수 마감'
  if (difference < 60_000) return '1분 미만 남음'
  const minutes = Math.ceil(difference / 60_000)
  return `${minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ` : ''}${minutes % 60}분 남음`
}
