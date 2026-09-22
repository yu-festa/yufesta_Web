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

export function getMatchSummary() {
  return apiRequest<MatchSummary>('/api/v1/match/summary')
}

export function getMatchTags() {
  return apiRequest<MatchTagOption[]>('/api/v1/match/tags')
}

export function getMyApplication() {
  return apiRequest<MatchApplication>('/api/v1/match/applications/me')
}
