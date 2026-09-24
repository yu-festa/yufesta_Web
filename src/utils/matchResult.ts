import type { MatchResult } from './instating.ts'

export type ResultView = { roundSeq: number; result: MatchResult; nextRoundSeq: number | null; hasNextRoundApplication: boolean; canRejoin: boolean }

export function toMatchResult(data: unknown): ResultView {
  const invalid = () => new Error('매칭 결과 형식을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.')
  if (!data || typeof data !== 'object') throw invalid()
  const value = data as Record<string, unknown>
  if (!Number.isSafeInteger(value.roundSeq) || (value.roundSeq as number) < 1 || !Array.isArray(value.partners)) throw invalid()
  if (value.nextRoundSeq !== null && (!Number.isSafeInteger(value.nextRoundSeq) || (value.nextRoundSeq as number) <= (value.roundSeq as number))) throw invalid()
  if (typeof value.hasNextRoundApplication !== 'boolean' || typeof value.canRejoin !== 'boolean') throw invalid()
  const metadata = { roundSeq: value.roundSeq as number, nextRoundSeq: value.nextRoundSeq as number | null, hasNextRoundApplication: value.hasNextRoundApplication, canRejoin: value.canRejoin }
  if (value.status === 'UNMATCHED') return { ...metadata, result: { status: 'unmatched' } }
  if (value.status !== 'MATCHED') throw invalid()
  const partners = value.partners.map((card: unknown) => {
    if (!card || typeof card !== 'object') throw invalid()
    const item = card as Record<string, unknown>
    if (!Number.isSafeInteger(item.matchId) || (item.matchId as number) < 1 || typeof item.nickname !== 'string' || typeof item.instagramId !== 'string') throw invalid()
    if (!Array.isArray(item.tags) || !item.tags.every(tag => typeof tag === 'string') || !Array.isArray(item.commonTags) || !item.commonTags.every(tag => typeof tag === 'string')) throw invalid()
    if ((item.ageBand != null && typeof item.ageBand !== 'string') || (item.intro != null && typeof item.intro !== 'string')) throw invalid()
    const instagram = item.instagramId.replace(/^@/, '')
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(instagram)) throw invalid()
    const wantedSlot = item.wantedSlot && typeof item.wantedSlot === 'object' ? item.wantedSlot as Record<string, unknown> : null
    if (wantedSlot && (typeof wantedSlot.title !== 'string' || typeof wantedSlot.stageName !== 'string' || typeof wantedSlot.startAt !== 'string')) throw invalid()
    return { matchId: item.matchId as number, nickname: item.nickname, instagram, ageBand: item.ageBand as string | null, intro: item.intro as string | null, tags: item.tags as string[], commonTags: item.commonTags as string[], wantedSlot: wantedSlot ? { title: wantedSlot.title as string, stageName: wantedSlot.stageName as string, startAt: wantedSlot.startAt as string } : null, sameSlot: item.sameSlot === true }
  })
  if (new Set(partners.map(partner => partner.matchId)).size !== partners.length) throw invalid()
  return { ...metadata, result: { status: 'matched', partners } }
}
