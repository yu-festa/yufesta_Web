import { useRef, useState } from 'react'
import { reportMatch } from '../api/match'

export default function MatchReportForm({ matchId, nickname, onReported }: { matchId: number; nickname: string; onReported: (matchId: number) => void }) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)

  if (!open) return <button type="button" className="mt-3 min-h-10 text-xs text-[#788397] underline" onClick={() => setOpen(true)}>상대 신고하기</button>
  return <form className="mt-4 rounded-xl border border-red-100 bg-red-50/50 p-4 text-left" onSubmit={async event => {
    event.preventDefault()
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      await reportMatch({ matchId, reason: 'FAKE', detail: detail.trim() })
      onReported(matchId)
    } catch (reason) { setError(reason instanceof Error ? reason.message : '신고하지 못했어요. 다시 시도해 주세요.') }
    finally { lock.current = false; setBusy(false) }
  }}>
    <h2 className="text-sm font-semibold">{nickname}님 신고</h2>
    <p className="mt-2 text-xs leading-5 text-[#63708a]">신고하면 이 카드가 사라지고 이후 회차에서도 다시 매칭되지 않아요. 상대에게는 신고 사실이 알려지지 않아요.</p>
    <label className="mt-3 block text-xs">신고 사유<select className="mt-2 w-full rounded-lg border border-[#dce5f5] bg-white p-3 text-base" value="FAKE" disabled><option value="FAKE">프로필 정보가 사실과 달라요</option></select></label>
    <label className="mt-3 block text-xs">상세 설명<textarea className="mt-2 w-full rounded-lg border border-[#dce5f5] bg-white p-3 text-base" value={detail} onChange={event => setDetail(event.target.value)} rows={3} disabled={busy} /></label>
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    <div className="mt-3 flex gap-2"><button className="rounded-lg bg-red-700 px-4 py-3 text-xs text-white disabled:opacity-50" type="submit" disabled={busy}>{busy ? '신고 중…' : '신고 접수하기'}</button><button className="rounded-lg border px-4 py-3 text-xs" type="button" disabled={busy} onClick={() => setOpen(false)}>돌아가기</button></div>
  </form>
}
