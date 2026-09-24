import { apiRequest } from './client.ts'

export type NoticeInput = { title: string; body: string; banner: boolean }
export type Notice = NoticeInput & { id: number; createdAt: string }
export const getNotices = () => apiRequest<Notice[]>('/api/v1/notices?size=50')
export const getNotice = (id: number) => apiRequest<Notice>(`/api/v1/notices/${id}`)
