import { apiRequest } from './client.ts'
import type { ContentReportTarget } from './contentReports.ts'
import type { LostItem } from './lostItems.ts'
import type { SlotType } from './timetable.ts'

const root = '/api/v1/admin'
const write = <T>(path: string, method: string, body?: unknown) => apiRequest<T>(`${root}${path}`, {
  method, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})

export type AdminTimetableSlot = {
  id: number; sortOrder: number; title: string; slotType: SlotType
  startAt: string; endAt: string; changedFromStart: string | null
  delayMinutes: number | null; liveOverride: boolean | null
  stagePlaceId: number; stageName: string; clubId: number | null; clubName: string | null
}
export type NewTimetableSlot = {
  title: string; slotType: SlotType; startAt: string; endAt: string
  stagePlaceId: number; clubId: number | null; sortOrder: number
}
export type UpdateTimetableSlot = Pick<NewTimetableSlot, 'title' | 'slotType' | 'stagePlaceId' | 'clubId'>
export const getAdminTimetable = () => apiRequest<AdminTimetableSlot[]>(`${root}/timetable`)
export const createTimetableSlot = (body: NewTimetableSlot) => write<AdminTimetableSlot>('/timetable', 'POST', body)
export const updateTimetableSlot = (id: number, body: UpdateTimetableSlot) => write<AdminTimetableSlot>(`/timetable/${id}`, 'PATCH', body)
export const changeTimetableSlotTimes = (id: number, startAt: string, endAt: string) => write<AdminTimetableSlot>(`/timetable/${id}/times`, 'PATCH', { startAt, endAt })
export const setTimetableSlotLive = (id: number, live: boolean) => write<AdminTimetableSlot>(`/timetable/${id}/live`, 'PATCH', { live })
export const setTimetableSlotDelay = (id: number, delayMinutes: number | null) => write<AdminTimetableSlot>(`/timetable/${id}/delay`, 'PATCH', { delayMinutes })
export const reorderTimetableSlots = (slotIds: number[]) => write<AdminTimetableSlot[]>('/timetable/order', 'PUT', { slotIds })
export const deleteTimetableSlot = (id: number) => write<void>(`/timetable/${id}`, 'DELETE')

export type AdminClub = {
  id: number; name: string; intro: string; genre: string | null
  signatureSong: string | null; instagramUrl: string | null; photoUrl: string | null
  sortOrder: number; createdById: number | null
}
export type ClubInput = Omit<AdminClub, 'id' | 'createdById'>
export const getAdminClubs = () => apiRequest<AdminClub[]>(`${root}/clubs`)
export const createAdminClub = (body: ClubInput) => write<AdminClub>('/clubs', 'POST', body)
export const updateAdminClub = (id: number, body: ClubInput) => write<AdminClub>(`/clubs/${id}`, 'PATCH', body)
export const deleteAdminClub = (id: number) => write<void>(`/clubs/${id}`, 'DELETE')

export type OfficialLostItemInput = { description: string; placeText: string; occurredAt: string | null }
export const createOfficialLostItem = (body: OfficialLostItemInput) => write<LostItem>('/lost-items', 'POST', body)
export const setLostItemVisibility = (id: number, hidden: boolean) => write<LostItem>(`/lost-items/${id}/visibility`, 'PATCH', { hidden })
export const resolveAdminLostItem = (id: number) => write<LostItem>(`/lost-items/${id}/resolve`, 'PATCH')
export const setCheerVisibility = (id: number, hidden: boolean) => write<void>(`/cheers/${id}/visibility`, 'PATCH', { hidden })

export type AdminContentReport = {
  id: number; targetType: ContentReportTarget; targetId: number; reporterUserId: number | null
  reason: string; createdAt: string; reviewedAt: string | null
  targetReportCount: number; targetHidden: boolean
}
export function getAdminContentReports(reviewed?: boolean, targetType?: ContentReportTarget, page = 0, size = 20) {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  if (reviewed !== undefined) query.set('reviewed', String(reviewed))
  if (targetType) query.set('targetType', targetType)
  return apiRequest<AdminContentReport[]>(`${root}/content-reports?${query}`)
}
export const reviewContentReport = (id: number) => write<AdminContentReport>(`/content-reports/${id}/review`, 'PATCH')
