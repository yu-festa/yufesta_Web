import type { UserRole } from '../api/auth.ts'
import type { AdminRound, RoundTimes } from '../api/admin.ts'

export const isAdminRole = (role: unknown): role is 'STAFF' | 'OWNER' => role === 'STAFF' || role === 'OWNER'
export const loginDestination = (role: UserRole | null) => isAdminRole(role) ? '/admin' : '/main'
export const roundLabels = { SCHEDULED: '접수 예정', OPEN: '접수 중', CLOSED: '마감 · 발표 대기', PUBLISHED: '발표 완료' }

export function roundActions(round: AdminRound, role: UserRole) {
  const unpublished = round.status !== 'PUBLISHED' && !round.publishedAt
  return {
    open: isAdminRole(role) && unpublished && round.status === 'SCHEDULED',
    close: isAdminRole(role) && unpublished && round.status === 'OPEN',
    rerun: isAdminRole(role) && unpublished && round.status === 'CLOSED',
    publish: role === 'OWNER' && unpublished && round.status === 'CLOSED',
    times: isAdminRole(role) && unpublished,
  }
}

export function toKoreanInput(value: string) {
  if (!value) return ''
  const date = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}+09:00`)
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() + 9 * 3600000).toISOString().slice(0, 19)
}
export function displayAdminTime(value: string | null) {
  return value ? toKoreanInput(value).replace('T', ' ') || '시각 확인 필요' : '아직 없음'
}
export function validateRoundTimes(times: RoundTimes) {
  const [open, close, publish] = [times.openAt, times.closeAt, times.publishAt].map(value => new Date(`${value}+09:00`).getTime())
  if (![open, close, publish].every(Number.isFinite)) return '모든 시각을 올바르게 입력해 주세요.'
  if (open >= close) return '접수 시작은 마감보다 빨라야 합니다.'
  if (publish - close !== 10 * 60 * 1000) return '마감은 발표 시각의 정확히 10분 전이어야 합니다.'
  return ''
}
