import { useRef, useState } from 'react'
import { rejoinMatch } from '../api/match'
import type { ResultView } from '../utils/matchResult'

export default function MatchRejoin({ data, onChanged, disabled = false }: { data: ResultView; onChanged: () => Promise<void>; disabled?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  async function submit() {
    if (lock.current || done || disabled || !data.canRejoin) return
    lock.current = true
    setBusy(true)
    setError('')
    try { await rejoinMatch(); setDone(true); await onChanged() }
    catch (reason) { setError(reason instanceof Error ? reason.message : '재참여하지 못했어요.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="rounded-2xl border border-[#dce5f5] bg-white p-5 text-center" aria-label="다음 회차 참여">
    <p className="text-sm text-[#63708a]">{data.nextRoundSeq === null ? '마지막 회차의 결과입니다.' : done || data.hasNextRoundApplication ? `${data.nextRoundSeq}차 신청이 완료되어 있어요.` : data.canRejoin ? `이전 신청 정보로 ${data.nextRoundSeq}차에 다시 참여할 수 있어요.` : '현재 재참여할 수 없어요. 다음 회차 접수 상태를 확인해 주세요.'}</p>
    {data.canRejoin && !done && !data.hasNextRoundApplication && <button type="button" disabled={busy || disabled} onClick={() => void submit()} className="mt-4 w-full rounded-xl bg-[#1554ff] p-4 text-sm font-semibold text-white disabled:opacity-40">{busy ? '재참여 중…' : `${data.nextRoundSeq}차 재참여하기`}</button>}
    {done && <p role="status" className="mt-3 text-sm text-[#1554ff]">이전 신청 정보로 재참여했어요.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>
}
