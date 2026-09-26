import { useCallback, useRef, useState } from 'react'
import { createLostItemComment, createLostItemReply, deleteLostItemComment, getLostItemComments } from '../api/lostItems'
import type { LostItemComment } from '../api/lostItems'
import { createContentReport } from '../api/contentReports'
import { usePublicResource } from '../hooks/usePublicResource'
import { formatLostItemTime } from '../utils/lostItemDisplay'
import LostFoundIcon from './LostFoundIcon'

const inputClass = 'min-h-11 w-full rounded-lg border border-[#dbe4f5] bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#1554ff]'
const actionClass = 'min-h-9 text-xs text-[#8a93a6] underline disabled:opacity-50'

export default function LostComments({ postId, isAuthenticated, onLogin }: { postId: number; isAuthenticated: boolean; onLogin: () => void }) {
  const load = useCallback(() => getLostItemComments(postId), [postId])
  const resource = usePublicResource(load)
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [reply, setReply] = useState('')
  const [reportId, setReportId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const lock = useRef(false)
  const comments = resource.data ?? []
  const count = comments.reduce((total, comment) => total + (comment.deleted ? 0 : 1) + (comment.replies ?? []).filter(reply => !reply.deleted).length, 0)
  async function act(work: () => Promise<unknown>, after: () => void, message: string) {
    if (!isAuthenticated) { onLogin(); return }
    if (lock.current) return
    lock.current = true; setBusy(true); setError(''); setNotice('')
    try { await work(); after(); setNotice(message); await resource.refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : '요청을 처리하지 못했어요.') }
    finally { lock.current = false; setBusy(false) }
  }
  function renderComment(comment: LostItemComment, nested = false) {
    return <li key={comment.id} className={nested ? 'mt-3 rounded-xl bg-[#f7f9ff] px-3 py-2' : 'border-b border-[#edf0f5] py-4'}>
      <div className="flex items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e5edff] text-xs font-semibold text-[#89a5e9]" aria-hidden="true">{comment.deleted ? '−' : comment.displayName?.slice(0, 1) || '익'}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2"><strong className="break-all text-xs text-[#293449]">{comment.deleted ? '삭제된 댓글' : comment.displayName || '익명'}</strong>{!comment.deleted && comment.postAuthor && <span className="text-[10px] font-semibold text-[#1554ff]">작성자</span>}
            {!comment.deleted && (comment.mine ? <button type="button" disabled={busy} className={actionClass} onClick={() => { if (window.confirm('이 댓글을 삭제할까요?')) void act(() => deleteLostItemComment(postId, comment.id), () => { if (replyTo === comment.id) setReplyTo(null) }, '댓글을 삭제했어요.') }}>삭제</button> : <button type="button" disabled={busy} className={actionClass} onClick={() => { if (!isAuthenticated) { onLogin(); return } setReportId(reportId === comment.id ? null : comment.id); setReason('') }}>신고</button>)}
          </div>
          <p className={`mt-1 whitespace-pre-wrap wrap-anywhere text-sm leading-6 ${comment.deleted ? 'text-[#929bad]' : 'text-[#364152]'}`}>{comment.deleted ? '삭제된 댓글입니다.' : comment.content}</p>
          <div className="mt-1 flex items-center gap-3"><time className="text-[10px] text-[#929bad]" dateTime={comment.createdAt}>{formatLostItemTime(comment.createdAt)}</time>{!nested && !comment.deleted && <button type="button" disabled={busy} className={actionClass} onClick={() => { if (!isAuthenticated) { onLogin(); return } setReplyTo(replyTo === comment.id ? null : comment.id); setReply('') }}>답글</button>}</div>
          {reportId === comment.id && <form className="mt-2 rounded-lg bg-[#f5f8ff] p-3" onSubmit={event => { event.preventDefault(); void act(() => createContentReport('LOST_ITEM_COMMENT', comment.id, reason), () => { setReportId(null); setReason('') }, '신고가 접수됐어요.') }}>
            <label className="block text-xs">댓글 신고 사유<input className={`${inputClass} mt-2`} required maxLength={20} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} placeholder="20자 이내로 입력해 주세요" /></label>
            <div className="mt-2 flex gap-3"><button className="min-h-10 rounded-lg bg-[#1554ff] px-3 text-xs font-bold text-white disabled:opacity-50" disabled={busy || !reason.trim()}>신고 접수</button><button type="button" className={actionClass} disabled={busy} onClick={() => setReportId(null)}>취소</button></div>
          </form>}
          {!nested && replyTo === comment.id && <form className="mt-3" onSubmit={event => { event.preventDefault(); void act(() => createLostItemReply(postId, comment.id, reply), () => { setReplyTo(null); setReply('') }, '답글을 등록했어요.') }}>
            <label className="block text-xs font-semibold">{comment.displayName}님에게 답글<textarea className={`${inputClass} mt-2 resize-y`} required rows={2} maxLength={200} value={reply} disabled={busy} onChange={event => setReply(event.target.value)} /></label>
            <div className="mt-2 flex items-center gap-3"><span className="mr-auto text-[10px] text-[#929bad]">{reply.length}/200자</span><button type="button" className={actionClass} disabled={busy} onClick={() => setReplyTo(null)}>취소</button><button disabled={busy || !reply.trim()} className="min-h-10 rounded-lg bg-[#1554ff] px-3 text-xs font-bold text-white disabled:opacity-50">답글 등록</button></div>
          </form>}
          {!nested && !!comment.replies?.length && <ul aria-label="답글 목록">{comment.replies.map(child => renderComment(child, true))}</ul>}
        </div>
      </div>
    </li>
  }
  return <section className="mt-8 border-t border-[#edf0f5] pt-6" aria-labelledby="lost-comments-title" aria-busy={busy}>
    <h3 id="lost-comments-title" className="flex items-center gap-2 text-base font-bold text-[#293449]"><LostFoundIcon name="comment" className="size-5" />댓글 <span className="text-[#1554ff]">{resource.data ? count : '—'}</span></h3>
    {resource.loading && !resource.data && <p role="status" className="py-6 text-center text-sm text-[#929bad]">댓글을 불러오고 있어요…</p>}
    {resource.error && <p role="alert" className="mt-3 text-xs text-red-700">{resource.error}<button type="button" className="ml-2 underline" onClick={() => void resource.refresh()}>다시 불러오기</button></p>}
    {!resource.loading && !resource.error && !comments.length && <p className="py-8 text-center text-sm text-[#929bad]">물건을 찾는 데 도움이 되는 댓글을 남겨주세요.</p>}
    <ul aria-label="분실물 댓글 목록">{comments.map(comment => renderComment(comment))}</ul>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="mt-3 text-sm text-[#1554ff]">{notice}</p>}
    {isAuthenticated ? <form className="mt-5" onSubmit={event => { event.preventDefault(); void act(() => createLostItemComment(postId, content), () => setContent(''), '댓글을 등록했어요.') }}>
      <label htmlFor="lost-comment" className="mb-2 block text-xs font-semibold text-[#667085]">댓글 남기기</label>
      <textarea id="lost-comment" className={`${inputClass} resize-y`} rows={3} maxLength={200} required disabled={busy} value={content} onChange={event => setContent(event.target.value)} placeholder="물건의 주인을 찾을 수 있도록 이야기를 나눠주세요." />
      <div className="mt-2 flex items-center justify-between"><span className="text-xs text-[#929bad]">{content.length}/200자</span><button disabled={busy || !content.trim()} className="min-h-11 rounded-lg bg-[#1554ff] px-4 text-sm font-bold text-white disabled:opacity-50">{busy ? '처리 중…' : '댓글 등록'}</button></div>
    </form> : <button type="button" className="mt-5 min-h-12 w-full rounded-xl bg-[#edf3ff] px-4 text-sm font-semibold text-[#1554ff]" onClick={onLogin}>로그인 후 댓글 남기기</button>}
  </section>
}
