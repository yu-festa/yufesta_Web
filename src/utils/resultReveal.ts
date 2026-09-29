const STORAGE_KEY = 'yufesta.instating.revealed-rounds.2026.v1'
type RevealStorage = Pick<Storage, 'getItem' | 'setItem'>

// 인증 API에 사용자 ID가 없으므로 로그인 세션이 끝나면 기록을 지웁니다.
// 신청 ID 대신 회차를 써야 다음 회차에 재참여한 뒤에도 이전 결과를 기억합니다.
export function createResultRevealStore(getStorage: () => RevealStorage) {
  let remembered = new Set<number>()
  let storageUnavailable = false

  function read() {
    if (storageUnavailable) return remembered
    try {
      const data: unknown = JSON.parse(getStorage().getItem(STORAGE_KEY) ?? '[]')
      remembered = new Set(Array.isArray(data) ? data.filter((value): value is number => Number.isSafeInteger(value) && value > 0) : [])
    } catch { storageUnavailable = true }
    return remembered
  }

  function write(rounds: Set<number>) {
    remembered = rounds
    try { getStorage().setItem(STORAGE_KEY, JSON.stringify([...rounds])) }
    catch { storageUnavailable = true }
  }

  return {
    has(roundSeq: number | undefined) {
      return roundSeq !== undefined && read().has(roundSeq)
    },
    mark(roundSeq: number) {
      if (!Number.isSafeInteger(roundSeq) || roundSeq <= 0) return
      write(new Set([...read(), roundSeq]))
    },
    clear() { write(new Set()) },
  }
}

export const resultRevealStore = createResultRevealStore(() => window.localStorage)
