import { apiRequest } from './client.ts'

export type RoundStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'PUBLISHED'
export type MatchResultStatus = 'MATCHED' | 'UNMATCHED'
export type Gender = 'M' | 'F'
export type EntryType = 'NEW' | 'CARRIED' | 'REJOIN'
export type AgeBand = '19-21' | '22-24' | '25-27' | '28+'
export type MatchTag = 'ALCOHOL' | 'PERFORMANCE' | 'SPORTS' | 'GAME' | 'CAFE' | 'MOVIE' | 'MUSIC' | 'PHOTO' | 'PET' | 'ETC'

export type MatchRound = {
  seq: number
  status: RoundStatus
  openAt: string
  closeAt: string
  publishAt: string
}

export type MatchSummary = {
  serverNow: string
  currentRound: MatchRound
  nextRound: MatchRound | null
  applicantCount: number
  my: null | {
    applied: boolean
    lastResult: null | { roundSeq: number; status: MatchResultStatus }
  }
}

export type MatchTagOption = { code: MatchTag; label: string }

export type MatchApplication = {
  id: number
  roundSeq: number
  instagramId: string
  nickname: string
  gender: Gender
  ageBand: AgeBand | null
  tags: MatchTag[]
  intro: string | null
  entryType: EntryType
  createdAt: string
}

export type MatchApplicationRequest = {
  instagramId: string
  nickname: string
  gender: Gender
  ageBand: AgeBand | null
  tags: MatchTag[]
  intro: string | null
  termsVersion: string
  privacyVersion: string
  ageConfirmed: boolean
}

export function createMatchApplication(application: MatchApplicationRequest) {
  return apiRequest<void>('/api/v1/match/applications', { method: 'POST', body: JSON.stringify(application) })
}

export function cancelMyApplication() {
  return apiRequest<void>('/api/v1/match/applications/me', { method: 'DELETE' })
}

export function rejoinMatch() {
  return apiRequest<void>('/api/v1/match/applications/rejoin', { method: 'POST' })
}

// 성공 응답은 utils/matchResult.ts의 임시 계약 어댑터에서 검증합니다.
export function getMyMatchResults(roundSeq?: number) {
  const query = roundSeq === undefined ? '' : `?${new URLSearchParams({ roundSeq: String(roundSeq) })}`
  return apiRequest<unknown>(`/api/v1/match/results/me${query}`)
}

export function reportMatch(report: { matchId: number; reason: string; detail: string }) {
  return apiRequest<void>('/api/v1/match/reports', { method: 'POST', body: JSON.stringify(report) })
}

export function getMatchSummary() {
  return apiRequest<MatchSummary>('/api/v1/match/summary')
}

export function getMatchTags() {
  return apiRequest<MatchTagOption[]>('/api/v1/match/tags')
}

export function getMyApplication() {
  return apiRequest<MatchApplication>('/api/v1/match/applications/me')
}
