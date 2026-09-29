import { ApiError, apiRequest } from './client.ts'

export type Cheer = { id: number; content: string; displayName: string; mine: boolean; createdAt: string }
export const getCheers = () => apiRequest<Cheer[]>('/api/v1/cheers?size=50')
export function createCheer(content: string) {
  const trimmed = content.trim()
  if (!trimmed || trimmed.length > 40) throw new Error('응원은 1~40자로 입력해 주세요.')
  return apiRequest<Cheer>('/api/v1/cheers', { method: 'POST', body: JSON.stringify({ content: trimmed }) }).catch(reason => {
    if (reason instanceof ApiError && reason.status === 429) {
      throw new ApiError({ status: reason.status, code: reason.code, errors: reason.errors, message: '60초 후에 다시 입력해주세요' })
    }
    throw reason
  })
}
