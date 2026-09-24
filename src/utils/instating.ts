export type InstatingApplication = {
  nickname: string
  instagram: string
  gender: string
  age: string
  tags: string[]
  performance: string
  wantedSlotId?: number | null
  introduction: string
  multipleMatches: boolean
}

export type MatchResult =
  | { status: 'pending' }
  | { status: 'unmatched' }
  | { status: 'matched'; partners: { matchId?: number; nickname: string; instagram: string; ageBand?: string | null; tags?: string[]; commonTags?: string[]; intro?: string | null; wantedSlot?: { title: string; stageName: string; startAt: string } | null; sameSlot?: boolean }[] }

export type SavedApplication = InstatingApplication & { id: string; submittedAt: string }
export const APPLICATION_STORAGE_KEY = 'yufesta.instating.applications.v1'
export const REVEAL_TAPS = 5

export function nextRevealTap(count: number) {
  return Math.min(REVEAL_TAPS, Math.max(0, count) + 1)
}

export function parseApplications(raw: string | null): SavedApplication[] {
  try {
    const data: unknown = JSON.parse(raw ?? '[]')
    if (!Array.isArray(data)) return []
    return data.filter((value): value is SavedApplication => {
      if (!value || typeof value !== 'object') return false
      const keys = ['id', 'submittedAt', 'nickname', 'instagram', 'gender', 'age', 'performance', 'introduction']
      return keys.every(key => typeof value[key] === 'string') &&
        /^[A-Za-z0-9._]{1,30}$/.test(value.instagram) &&
        Array.isArray(value.tags) && value.tags.length <= 3 && value.tags.every((tag: unknown) => typeof tag === 'string') &&
        typeof value.multipleMatches === 'boolean'
    })
  } catch { return [] }
}

export function readApplications(): SavedApplication[] {
  try { return parseApplications(window.localStorage.getItem(APPLICATION_STORAGE_KEY)) } catch { return [] }
}

// Local UI preview only: this never creates a server-side application or a match.
export class AlreadyAppliedError extends Error {
  constructor() { super('이미 인스타팅 신청을 완료했어요.'); this.name = 'AlreadyAppliedError' }
}

export async function saveApplication(application: InstatingApplication, storage: Pick<Storage, 'getItem' | 'setItem'> = window.localStorage, options: { allowRepeat?: boolean } = {}): Promise<SavedApplication> {
  const saveOnce = () => {
    // Recheck immediately before writing, including forms opened before another tab submitted.
    const existing = parseApplications(storage.getItem(APPLICATION_STORAGE_KEY))
    if (existing.length > 0 && !options.allowRepeat) throw new AlreadyAppliedError()
    const record = { ...application, nickname: application.nickname.trim(), id: crypto.randomUUID(), submittedAt: new Date().toISOString() }
    storage.setItem(APPLICATION_STORAGE_KEY, JSON.stringify([record, ...existing]))
    return record
  }
  // Serialize submissions across tabs on browsers supporting Web Locks.
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(APPLICATION_STORAGE_KEY, saveOnce)
  }
  return saveOnce()
}
