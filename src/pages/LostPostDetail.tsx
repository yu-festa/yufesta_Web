import { useState } from 'react'
import AppLayout from '../layout/AppLayout'
import LostFoundIcon from '../components/LostFoundIcon'
import LostPostImage from '../components/LostPostImage'
import LostComments from '../components/LostComments'
import { createContentReport } from '../api/contentReports'
import { deleteLostItem, getLostItems, resolveLostItem } from '../api/lostItems'
import type { LostItem } from '../api/lostItems'
import { usePublicResource } from '../hooks/usePublicResource'
import { formatContentTime } from '../utils/publicContent'
import { formatLostItemTime, lostItemLabels, splitLostItemDescription } from '../utils/lostItemDisplay'

type Props = { postId: string; post: LostItem | null; onBack: () => void; onHome: () => void; onChanged: () => void; isAuthenticated: boolean; onLogin: () => void }
const focusStyle = 'focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1554ff]'

export default function LostPostDetail({ postId, post, onBack, onHome, onChanged, isAuthenticated, onLogin }: Props) {
  const resource = usePublicResource(getLostItems)
  const item = resource.data?.find(value => String(value.id) === postId) ?? post
  const [reason, setReason] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [resolved, setResolved] = useState(false)
  const detail = item ? splitLostItemDescription(item.description) : null

  async function act(work: () => Promise<unknown>, success: string, after?: () => void) {
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try { await work(); setNotice(success); after?.() }
    catch (cause) { setError(cause instanceof Error ? cause.message : '요청을 처리하지 못했어요.') }
    finally { setBusy(false) }
  }

  return <AppLayout padded={false} header={<div className="relative flex h-16 items-center justify-between border-b border-[#edf0f5]">
    <button type="button" onClick={onBack} aria-label="분실물 게시판으로 돌아가기" className={`-ml-2 grid size-11 cursor-pointer place-items-center rounded-full text-[#263247] ${focusStyle}`}><LostFoundIcon name="back" className="size-5" /></button>
    <div className="pointer-events-none absolute inset-x-12 text-center"><h1 className="text-base font-semibold text-[#222]">분실물 게시판</h1></div>
    <button type="button" onClick={onHome} aria-label="메인으로 돌아가기" className={`-mr-2 grid size-11 cursor-pointer place-items-center rounded-full text-[#788399] ${focusStyle}`}><LostFoundIcon name="home" className="size-5" /></button>
  </div>}>
    {resource.loading && !item ? <p className="px-6 py-24 text-center text-sm text-[#8892a4]" role="status">게시글을 불러오고 있어요…</p>
      : resource.error && !item ? <div className="px-6 py-24 text-center" role="alert"><p className="text-sm text-[#667085]">{resource.error}</p><button type="button" className={`mt-5 cursor-pointer rounded-xl bg-[#edf3ff] px-5 py-3 text-sm font-semibold text-[#1554ff] ${focusStyle}`} onClick={() => void resource.refresh()}>다시 불러오기</button></div>
        : !item || !detail ? <div className="px-6 py-24 text-center"><LostFoundIcon name="search" className="mx-auto size-9 text-[#9db5e8]" /><h2 className="mt-5 text-lg font-bold">게시글을 찾을 수 없어요</h2><p className="mt-2 text-sm leading-relaxed text-[#8892a4]">최근 게시글에서 이 글을 찾을 수 없어요.<br />게시판에서 다른 글을 확인해 주세요.</p><button type="button" onClick={onBack} className={`mt-6 cursor-pointer rounded-xl bg-[#1554ff] px-5 py-3 text-sm font-semibold text-white ${focusStyle}`}>게시판으로 돌아가기</button></div>
          : <article className="px-(--app-content-padding) pt-6 pb-20" aria-labelledby="lost-detail-title">
            <div className="flex items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf3ff] text-[#7a9de9]"><LostFoundIcon name="user" className="size-6" /></div><div className="flex-1"><p className="text-sm font-semibold text-[#293449]">{item.displayName || '익명'}</p><time className="mt-0.5 block text-[11px] text-[#9199a8]" dateTime={item.createdAt}>{formatLostItemTime(item.createdAt)}</time></div><span className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${item.kind === 'FOUND' ? 'bg-[#1554ff] text-white' : 'bg-[#edf3ff] text-[#1554ff]'}`}>{lostItemLabels[item.kind]}</span></div>
            <h2 id="lost-detail-title" className="mt-6 text-[22px] leading-snug font-bold tracking-[-0.6px] text-[#202939]">{detail.title}</h2>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#f5f8ff] px-3.5 py-3 text-xs leading-5"><LostFoundIcon name="pin" className="mt-0.5 size-4 shrink-0 text-[#1554ff]" /><span className="shrink-0 font-semibold text-[#1554ff]">{item.kind === 'LOST' ? '분실 장소' : '발견 장소'}</span><span className="text-[#5b6b85]">{item.placeText}</span></div>
            {detail.body && <p className="mt-5 whitespace-pre-wrap text-[15px] leading-[1.85] text-[#364152]">{detail.body}</p>}
            <LostPostImage postId={item.id} image={item.image ?? null} isAuthenticated={isAuthenticated} onChanged={image => { resource.replaceData(current => (current ?? [item]).map(post => post.id === item.id ? { ...post, image } : post)); onChanged() }} />
            {item.occurredAt && <p className="mt-5 text-xs text-[#78869d]">{item.kind === 'LOST' ? '분실 시각' : '발견 시각'} · {formatContentTime(item.occurredAt)}</p>}
            {(resolved || item.status === 'RESOLVED') && <p className="mt-6 inline-flex rounded-lg bg-[#edf3ff] px-3 py-2 text-xs font-semibold text-[#1554ff]">해결된 글이에요</p>}
            <div className="mt-8 flex flex-wrap gap-2 border-t border-[#edf0f5] pt-6">
              {isAuthenticated ? <>{!resolved && item.status === 'OPEN' && <button type="button" disabled={busy} className={`min-h-10 rounded-lg border border-[#dbe4f5] px-4 text-sm font-semibold text-[#1554ff] ${focusStyle}`} onClick={() => void act(() => resolveLostItem(item.id), '해결된 글로 변경했어요.', () => { setResolved(true); onChanged() })}>해결 처리</button>}<button type="button" disabled={busy} className={`min-h-10 rounded-lg border border-[#e5e8ef] px-4 text-sm text-[#6c7890] ${focusStyle}`} onClick={() => { if (window.confirm('게시글을 삭제할까요?')) void act(() => deleteLostItem(item.id), '게시글을 삭제했어요.', () => { onChanged(); onBack() }) }}>삭제</button><button type="button" disabled={busy} className={`min-h-10 rounded-lg border border-[#e5e8ef] px-4 text-sm text-[#6c7890] ${focusStyle}`} onClick={() => setReportOpen(value => !value)}>신고</button></> : <button type="button" className={`min-h-10 rounded-lg border border-[#e5e8ef] px-4 text-sm text-[#6c7890] ${focusStyle}`} onClick={onLogin}>로그인 후 신고하기</button>}
            </div>
            {isAuthenticated && <p className="mt-2 text-[11px] text-[#929bad]">해결 처리와 삭제는 본인이 작성한 글에만 적용돼요.</p>}
            {reportOpen && <form className="mt-4 rounded-xl bg-[#f7f9ff] p-4" onSubmit={event => { event.preventDefault(); void act(() => createContentReport('LOST_ITEM', item.id, reason), '신고가 접수됐어요.', () => { setReportOpen(false); setReason('') }) }}><label className="block text-sm">신고 사유 (20자 이내)<input required maxLength={20} value={reason} onChange={event => setReason(event.target.value)} className="mt-2 block min-h-11 w-full rounded-lg border border-[#dbe4f5] px-3" /></label><button disabled={busy || !reason.trim()} className="mt-3 rounded-lg bg-[#1554ff] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">신고 접수</button></form>}
            {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-4 text-sm text-[#1554ff]">{notice}</p>}
            <LostComments key={`${item.id}:${isAuthenticated}`} postId={item.id} isAuthenticated={isAuthenticated} onLogin={onLogin} />
          </article>}
  </AppLayout>
}
