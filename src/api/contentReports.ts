import { apiRequest } from './client.ts'

export type ContentReportTarget = 'CHEER' | 'LOST_ITEM'
export type ContentReport = { id: number; targetType: ContentReportTarget; targetId: number; reason: string; createdAt: string }

export function createContentReport(targetType: ContentReportTarget, targetId: number, reason: string) {
  const trimmed = reason.trim()
  if (!trimmed || trimmed.length > 20) throw new Error('신고 사유를 1~20자로 입력해 주세요.')
  return apiRequest<ContentReport>('/api/v1/content-reports', { method: 'POST', body: JSON.stringify({ targetType, targetId, reason: trimmed }) })
}
