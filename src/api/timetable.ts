import { apiRequest } from './client.ts'

export type SlotType = 'CLUB' | 'GUEST' | 'EVENT'
export type TimetableSlot = {
  id: number; sortOrder: number; title: string; slotType: SlotType
  startAt: string; endAt: string; effectiveStartAt: string; effectiveEndAt: string
  delayMinutes: number | null; isLive: boolean; isChanged: boolean; changedFromStart: string | null
  stage: { placeId: number; name: string } | null
  club: { id: number; name: string } | null
}
export type TimetableData = { serverNow: string; slots: TimetableSlot[] }

export const getTimetable = () => apiRequest<TimetableData>('/api/v1/timetable')
