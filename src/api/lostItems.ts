import { apiRequest } from './client.ts'
import { validateLostItemImage } from '../utils/lostItemImage.ts'

export type LostItemKind = 'FOUND' | 'LOST'
export type LostItemImage = { id: number; imageUrl: string; thumbnailUrl: string }
export type LostItem = {
  id: number; kind: LostItemKind; description: string; placeText: string
  occurredAt: string | null; status: 'OPEN' | 'RESOLVED'
  displayName: string; createdAt: string; image?: LostItemImage | null
}
export type LostItemInput = Pick<LostItem, 'kind' | 'description' | 'placeText' | 'occurredAt'>

export const getLostItems = (size = 50) => apiRequest<LostItem[]>(`/api/v1/lost-items?size=${size}`)
export const createLostItem = (input: LostItemInput) => apiRequest<LostItem>('/api/v1/lost-items', { method: 'POST', body: JSON.stringify(input) })
export const resolveLostItem = (id: number) => apiRequest<LostItem>(`/api/v1/lost-items/${id}/resolve`, { method: 'PATCH' })
export const deleteLostItem = (id: number) => apiRequest<void>(`/api/v1/lost-items/${id}`, { method: 'DELETE' })

export function uploadLostItemImage(id: number, file: File) {
  validateLostItemImage(file)
  const body = new FormData()
  body.append('file', file)
  return apiRequest<LostItemImage>(`/api/v1/lost-items/${id}/images`, { method: 'POST', body })
}
export const deleteLostItemImage = (id: number, imageId: number) => apiRequest<void>(`/api/v1/lost-items/${id}/images/${imageId}`, { method: 'DELETE' })

export type LostItemComment = {
  id: number; parentId: number | null; content: string; displayName: string
  mine: boolean; postAuthor: boolean; deleted: boolean; createdAt: string
  replies: LostItemComment[]
}
export const getLostItemComments = (id: number) => apiRequest<LostItemComment[]>(`/api/v1/lost-items/${id}/comments`)
function commentBody(content: string) {
  const trimmed = content.trim()
  if (!trimmed || trimmed.length > 200) throw new Error('댓글을 1~200자로 입력해 주세요.')
  return JSON.stringify({ content: trimmed })
}
export const createLostItemComment = (id: number, content: string) => apiRequest<LostItemComment>(`/api/v1/lost-items/${id}/comments`, { method: 'POST', body: commentBody(content) })
export const createLostItemReply = (id: number, commentId: number, content: string) => apiRequest<LostItemComment>(`/api/v1/lost-items/${id}/comments/${commentId}/replies`, { method: 'POST', body: commentBody(content) })
export const deleteLostItemComment = (id: number, commentId: number) => apiRequest<void>(`/api/v1/lost-items/${id}/comments/${commentId}`, { method: 'DELETE' })
