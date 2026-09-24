import { apiRequest } from './client.ts'

export type LostItemKind = 'FOUND' | 'LOST'
export type LostItem = {
  id: number; kind: LostItemKind; description: string; placeText: string
  occurredAt: string | null; status: 'OPEN' | 'RESOLVED'
  displayName: string; createdAt: string
}
export type LostItemInput = Pick<LostItem, 'kind' | 'description' | 'placeText' | 'occurredAt'>

export const getLostItems = (size = 50) => apiRequest<LostItem[]>(`/api/v1/lost-items?size=${size}`)
export const createLostItem = (input: LostItemInput) => apiRequest<LostItem>('/api/v1/lost-items', { method: 'POST', body: JSON.stringify(input) })
export const resolveLostItem = (id: number) => apiRequest<LostItem>(`/api/v1/lost-items/${id}/resolve`, { method: 'PATCH' })
export const deleteLostItem = (id: number) => apiRequest<void>(`/api/v1/lost-items/${id}`, { method: 'DELETE' })
