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
export type MatchSlot = { id: number; title: string; slotType: 'CLUB' | 'GUEST' | 'EVENT'; startAt: string; endAt: string; stagePlaceId: number; stageName: string }
export type MatchSlots = { roundSeq: number; publishAt: string; slots: MatchSlot[] }

export type MatchApplication = {
  id: number
  roundSeq: number
  instagramId: string
  nickname: string
  gender: Gender
  ageBand: AgeBand | null
  tags: MatchTag[]
  intro: string | null
  wantedSlot: MatchSlot | null
  needsSlotReselect: boolean
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
  wantedSlotId: number | null
  termsVersion: string
  privacyVersion: string
  ageConfirmed: boolean
}

export function createMatchApplication(application: MatchApplicationRequest) {
  return apiRequest<MatchApplication>('/api/v1/match/applications', { method: 'POST', body: JSON.stringify(application) })
}

export type MatchApplicationUpdate = Omit<MatchApplicationRequest, 'termsVersion' | 'privacyVersion' | 'ageConfirmed'>
export function updateMyApplication(application: MatchApplicationUpdate) {
  return apiRequest<MatchApplication>('/api/v1/match/applications/me', { method: 'PATCH', body: JSON.stringify(application) })
}

export function cancelMyApplication() {
  return apiRequest<void>('/api/v1/match/applications/me', { method: 'DELETE' })
}

export function rejoinMatch() {
  return apiRequest<MatchApplication>('/api/v1/match/applications/rejoin', { method: 'POST' })
}

export type MatchPartner = { matchId: number; nickname: string; ageBand: AgeBand | null; tags: MatchTag[]; commonTags: MatchTag[]; intro: string | null; instagramId: string; wantedSlot: MatchSlot | null; sameSlot: boolean }
export type MyMatchResult = { roundSeq: number; status: MatchResultStatus; partners: MatchPartner[]; nextRoundSeq: number | null; hasNextRoundApplication: boolean; canRejoin: boolean }
export function getMyMatchResults(roundSeq?: number) {
  const query = roundSeq === undefined ? '' : `?${new URLSearchParams({ roundSeq: String(roundSeq) })}`
  return apiRequest<MyMatchResult>(`/api/v1/match/results/me${query}`)
}

export type ReportReason = 'PROFILE' | 'FAKE' | 'OTHER'
export function reportMatch(report: { matchId: number; reason: ReportReason; detail?: string }) {
  return apiRequest<{ id: number; matchId: number; reason: ReportReason; createdAt: string }>('/api/v1/match/reports', { method: 'POST', body: JSON.stringify(report) })
}

export function getMatchSummary() {
  return apiRequest<MatchSummary>('/api/v1/match/summary')
}

export function getMatchTags() {
  return apiRequest<MatchTagOption[]>('/api/v1/match/tags')
}

export function getMatchSlots() {
  return apiRequest<MatchSlots>('/api/v1/match/slots')
}

export function getMyApplication() {
  return apiRequest<MatchApplication>('/api/v1/match/applications/me')
}
