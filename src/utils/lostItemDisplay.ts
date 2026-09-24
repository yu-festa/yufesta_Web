import { parseMatchTime } from './match.ts'

export const lostItemLabels = { LOST: '찾고 있어요', FOUND: '주웠어요' } as const
export const MAX_LOST_DESCRIPTION = 100

// 공개 API에는 별도 제목·본문 필드가 없어 설명 한 필드에 줄바꿈으로 함께 저장합니다.
export function composeLostItemDescription(title: string, body: string) {
  const combined = `${title.trim()}\n${body.trim()}`
  if (!title.trim()) throw new Error('제목을 입력해 주세요.')
  if (!body.trim()) throw new Error('내용을 입력해 주세요.')
  if (combined.length > MAX_LOST_DESCRIPTION) throw new Error('제목과 내용을 합쳐 100자 이내로 입력해 주세요.')
  return combined
}

export function splitLostItemDescription(description: string) {
  const lineBreak = description.indexOf('\n')
  return lineBreak < 0 ? { title: description, body: '' } : {
    title: description.slice(0, lineBreak).trim(), body: description.slice(lineBreak + 1).trim(),
  }
}

export function formatLostItemTime(createdAt: string, now = Date.now()) {
  const time = parseMatchTime(createdAt)
  if (!Number.isFinite(time)) return ''
  const minutes = Math.max(0, Math.floor((now - time) / 60_000))
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}일 전`
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(time).replace(/\.\s*/g, '.').replace(/\.$/, '')
}
