import type { MatchResult } from './instating.ts'

// 임시 성공 응답 계약: { roundSeq, status: MATCHED | UNMATCHED, cards: [{ matchId, nickname, instagramId }] }.
// 실제 Swagger 성공 응답이 확인되면 이 어댑터에서 필드 매핑만 변경합니다.
export function toMatchResult(data: unknown): { roundSeq: number; result: MatchResult } {
  const invalid = () => new Error('매칭 결과 형식을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.')
  if (!data || typeof data !== 'object') throw invalid()
  const value = data as Record<string, unknown>
  if (!Number.isSafeInteger(value.roundSeq) || (value.roundSeq as number) < 1) throw invalid()
  if (value.status === 'UNMATCHED') return { roundSeq: value.roundSeq as number, result: { status: 'unmatched' } }
  if (value.status !== 'MATCHED' || !Array.isArray(value.cards)) throw invalid()
  const partners = value.cards.map((card: unknown) => {
    if (!card || typeof card !== 'object') throw invalid()
    const item = card as Record<string, unknown>
    if (!Number.isSafeInteger(item.matchId) || (item.matchId as number) < 1 || typeof item.nickname !== 'string' || typeof item.instagramId !== 'string') throw invalid()
    const instagram = item.instagramId.replace(/^@/, '')
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(instagram)) throw invalid()
    return { matchId: item.matchId as number, nickname: item.nickname, instagram }
  })
  if (new Set(partners.map(partner => partner.matchId)).size !== partners.length) throw invalid()
  return { roundSeq: value.roundSeq as number, result: { status: 'matched', partners } }
}
