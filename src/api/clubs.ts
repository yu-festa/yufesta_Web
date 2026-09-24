import { apiRequest } from './client.ts'

export type ClubPerformance = {
  slotId: number; title: string; startAt: string; effectiveStartAt: string
  endAt: string; stagePlaceId: number; stageName: string
}
export type Club = {
  id: number; name: string; intro: string; genre: string | null
  signatureSong: string | null; instagramUrl: string | null; photoUrl: string | null
  performances: ClubPerformance[]
}

export const getClubs = () => apiRequest<Club[]>('/api/v1/clubs')
export const getClub = (id: number) => apiRequest<Club>(`/api/v1/clubs/${id}`)
