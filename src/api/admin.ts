import type { Notice, NoticeInput } from './notices.ts'
export type { Notice, NoticeInput } from './notices.ts'
export { getNotices, getNotice } from './notices.ts'
import { apiRequest } from './client.ts'
import type { PlaceEvent, ServerPlaceCategory } from './places.ts'

export type RoundStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'PUBLISHED'
export type RoundTimes = { openAt: string; closeAt: string; publishAt: string }
export type AdminRound = RoundTimes & {
  id: number; seq: number; status: RoundStatus; executedAt: string | null; publishedAt: string | null
}
export type BatchResult = {
  roundSeq: number; status: RoundStatus; executedAt: string | null; publishedAt: string | null
  poolSize: number; poolMen: number; poolWomen: number; matchedApplicants: number
  unmatchedApplicants: number; pairCount: number; firstPassPairs: number; secondPassPairs: number
  averageScore: number | null
}
export type ReportDecision = 'CONFIRM' | 'DISMISS'
export type AdminReport = {
  id: number; roundSeq: number | null; reporterUserId: number; targetUserId: number
  reason: 'PROFILE' | 'FAKE' | 'OTHER'; detail: string | null; createdAt: string
  reviewedAt: string | null; decision: ReportDecision | null; targetReportCount: number; targetBlocked: boolean
}
export type PlaceInput = {
  name: string; category: ServerPlaceCategory; latitude: number; longitude: number
  description: string; building: string; floor: string; sortOrder: number; active: boolean
}
export type AdminPlace = PlaceInput & { id: number }
export type EventInput = Omit<PlaceEvent, 'id'>

const root = '/api/v1/admin'
const write = <T>(path: string, method: string, body?: unknown) => apiRequest<T>(`${root}${path}`, {
  method, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})

export const getAdminRounds = () => apiRequest<AdminRound[]>(`${root}/match/rounds`)
export const getBatchResult = (id: number) => apiRequest<BatchResult>(`${root}/match/rounds/${id}/result`)
export const openRound = (id: number) => write<AdminRound>(`/match/rounds/${id}/open`, 'POST')
export const closeRound = (id: number) => write<BatchResult>(`/match/rounds/${id}/close`, 'POST')
export const rerunRound = (id: number) => write<BatchResult>(`/match/rounds/${id}/rerun`, 'POST')
export const publishRound = (id: number) => write<AdminRound>(`/match/rounds/${id}/publish`, 'POST')
export const updateRoundTimes = (id: number, times: RoundTimes) => write<AdminRound>(`/match/rounds/${id}/times`, 'PATCH', times)
export function getAdminReports(reviewed?: boolean, page = 0, size = 20) {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  if (reviewed !== undefined) query.set('reviewed', String(reviewed))
  return apiRequest<AdminReport[]>(`${root}/match/reports?${query}`)
}
export const reviewReport = (id: number, decision: ReportDecision) => write<AdminReport>(`/match/reports/${id}/review`, 'PATCH', { decision })

// 관리자 목록 API가 없는 공지·장소는 공개 조회 API를 사용합니다.
export const createNotice = (body: NoticeInput) => write<Notice>('/notices', 'POST', body)
export const updateNotice = (id: number, body: NoticeInput) => write<Notice>(`/notices/${id}`, 'PATCH', body)
export const deleteNotice = (id: number) => write<void>(`/notices/${id}`, 'DELETE')
export const createPlace = (body: PlaceInput) => write<AdminPlace>('/places', 'POST', body)
export const updatePlace = (id: number, body: PlaceInput) => write<AdminPlace>(`/places/${id}`, 'PATCH', body)
export const createPlaceEvent = (placeId: number, body: EventInput) => write<PlaceEvent>(`/places/${placeId}/events`, 'POST', body)
export const updatePlaceEvent = (placeId: number, eventId: number, body: EventInput) => write<PlaceEvent>(`/places/${placeId}/events/${eventId}`, 'PATCH', body)
