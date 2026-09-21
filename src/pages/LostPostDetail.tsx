import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import AppLayout from '../layout/AppLayout'
import LostFoundIcon from '../components/LostFoundIcon'
import { formatLostPostTime, lostPostLabels, MAX_LOST_COMMENT_LENGTH, validateLostComment } from '../utils/lostFound'
import type { LostComment, LostPost } from '../utils/lostFound'
import { loadLostPostDetail, saveLostComment } from '../utils/lostFoundStorage'

const focusStyle = 'focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1554ff]'

export default function LostPostDetail({ postId, onBack, onHome }: { postId: string; onBack: () => void; onHome: () => void }) {
  const [post, setPost] = useState<LostPost>()
  const [comments, setComments] = useState<LostComment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [draft, setDraft] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(Date.now)
  const busyRef = useRef(false)
  const lastCommentRef = useRef<HTMLLIElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let active = true
    void loadLostPostDetail(postId).then(detail => {
      if (active) { setPost(detail.post); setComments(detail.comments) }
    }).catch(cause => {
      if (active) setLoadError(cause instanceof Error ? cause.message : '게시글을 불러오지 못했어요.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [postId, reloadKey])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (notice) lastCommentRef.current?.scrollIntoView({ block: 'nearest' })
  }, [notice, comments.length])

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busyRef.current || !post) return
    const validation = validateLostComment(draft)
    if (validation) { setSaveError(validation); return }
    busyRef.current = true
    setSaving(true)
    setSaveError('')
    setNotice('')
    try {
      const comment = await saveLostComment(post.id, draft)
      setComments(current => [...current, comment])
      setDraft('')
      setNow(Date.now())
      setNotice('댓글이 등록되었어요.')
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : '댓글을 등록하지 못했어요.')
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  const composer = post && !loading && !loadError ? (
    <form onSubmit={submitComment} className="border-t border-[#edf0f5] py-3" aria-label="댓글 작성" aria-busy={saving}>
      {saveError && <p id="comment-error" role="alert" className="mb-2 text-xs text-red-700">{saveError}</p>}
      <div className="flex items-center gap-2 rounded-2xl border border-[#e7ecf4] bg-[#f5f7fb] p-2.5 focus-within:border-[#8caeff] focus-within:ring-2 focus-within:ring-[#edf3ff]">
        <label htmlFor="lost-comment" className="sr-only">댓글 입력</label>
        <textarea ref={inputRef} id="lost-comment" rows={2} maxLength={MAX_LOST_COMMENT_LENGTH} value={draft}
          onChange={event => { setDraft(event.target.value); setSaveError(''); setNotice('') }}
          disabled={saving} aria-invalid={Boolean(saveError)} aria-describedby={saveError ? 'comment-error comment-help' : 'comment-help'}
          placeholder="물건에 대한 단서를 댓글로 남겨주세요."
          className="min-h-11 min-w-0 flex-1 resize-none bg-transparent px-1.5 py-1 text-sm leading-6 text-[#222] outline-none placeholder:text-[#9aa3b4] disabled:opacity-60" />
        <button type="submit" disabled={saving || !draft.trim()} aria-label={saving ? '댓글 등록 중' : '댓글 등록'}
          className={`grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl bg-[#1554ff] text-white transition-colors hover:bg-[#1045d5] disabled:cursor-default disabled:bg-[#dce5f5] disabled:text-[#9aaccb] ${focusStyle}`}>
          <LostFoundIcon name="send" className="size-5" />
        </button>
      </div>
      <div id="comment-help" className="mt-2 flex justify-between gap-3 px-1 text-[10px] text-[#929bad]">
        <span>댓글은 이 브라우저에만 저장돼요.</span><span className="shrink-0 tabular-nums">{draft.length} / {MAX_LOST_COMMENT_LENGTH}</span>
      </div>
      <p role="status" className="sr-only">{notice}</p>
    </form>
  ) : undefined

  return (
    <AppLayout padded={false} fixedInput={composer} header={
      <div className="relative flex h-16 items-center justify-between border-b border-[#edf0f5]">
        <button type="button" onClick={onBack} aria-label="분실물 게시판으로 돌아가기" className={`-ml-2 grid size-11 cursor-pointer place-items-center rounded-full text-[#263247] ${focusStyle}`}><LostFoundIcon name="back" className="size-5" /></button>
        <div className="pointer-events-none absolute inset-x-12 text-center"><h1 className="text-base font-semibold text-[#222]">분실물 게시판</h1></div>
        <button type="button" onClick={onHome} aria-label="메인으로 돌아가기" className={`-mr-2 grid size-11 cursor-pointer place-items-center rounded-full text-[#788399] ${focusStyle}`}><LostFoundIcon name="home" className="size-5" /></button>
      </div>
    }>
      {loading ? <p className="px-6 py-24 text-center text-sm text-[#8892a4]" role="status">게시글을 불러오고 있어요…</p>
        : loadError ? <div className="px-6 py-24 text-center" role="alert"><p className="text-sm text-[#667085]">{loadError}</p><button type="button" className={`mt-5 cursor-pointer rounded-xl bg-[#edf3ff] px-5 py-3 text-sm font-semibold text-[#1554ff] ${focusStyle}`} onClick={() => { setLoading(true); setLoadError(''); setReloadKey(value => value + 1) }}>다시 불러오기</button></div>
          : !post ? <div className="px-6 py-24 text-center"><LostFoundIcon name="search" className="mx-auto size-9 text-[#9db5e8]" /><h2 className="mt-5 text-lg font-bold">게시글을 찾을 수 없어요</h2><p className="mt-2 text-sm leading-relaxed text-[#8892a4]">이 브라우저에 저장된 글이 없어요.<br />게시판에서 다른 글을 확인해 주세요.</p><button type="button" onClick={onBack} className={`mt-6 cursor-pointer rounded-xl bg-[#1554ff] px-5 py-3 text-sm font-semibold text-white ${focusStyle}`}>게시판으로 돌아가기</button></div>
            : <>
              <article className="px-(--app-content-padding) pt-6 pb-5" aria-labelledby="lost-detail-title">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf3ff] text-[#7a9de9]"><LostFoundIcon name="user" className="size-6" /></div>
                  <div className="flex-1"><p className="text-sm font-semibold text-[#293449]">익명</p><time className="mt-0.5 block text-[11px] text-[#9199a8]" dateTime={new Date(post.createdAt).toISOString()}>{formatLostPostTime(post.createdAt, now)}</time></div>
                  <span className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${post.kind === 'found' ? 'bg-[#1554ff] text-white' : 'bg-[#edf3ff] text-[#1554ff]'}`}>{lostPostLabels[post.kind]}</span>
                </div>
                <h2 id="lost-detail-title" className="mt-6 text-[22px] leading-snug font-bold tracking-[-0.6px] text-[#202939]">{post.title}</h2>
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#f5f8ff] px-3.5 py-3 text-xs leading-5">
                  <LostFoundIcon name="pin" className="mt-0.5 size-4 shrink-0 text-[#1554ff]" />
                  <span className="shrink-0 font-semibold text-[#1554ff]">{post.kind === 'lost' ? '분실 장소' : '발견 장소'}</span><span className="text-[#5b6b85]">{post.location}</span>
                </div>
                <p className="mt-5 text-[15px] leading-[1.85] whitespace-pre-wrap text-[#364152]">{post.content}</p>
                {post.photos.length > 0 && <div className="mt-5 space-y-3">{post.photos.map((photo, index) => <img key={photo.id} src={photo.src} alt={`${post.title} 첨부 사진 ${index + 1}`} className="h-auto w-full rounded-xl border border-[#edf0f5]" loading="lazy" />)}</div>}
                <button type="button" onClick={() => inputRef.current?.focus()} className={`mt-6 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#edf3ff] px-3 text-xs font-semibold text-[#1554ff] ${focusStyle}`}><LostFoundIcon name="comment" className="size-4" />댓글 {comments.length}</button>
              </article>
              <section className="border-t-[7px] border-[#f5f7fa] px-(--app-content-padding) pt-5 pb-4" aria-labelledby="lost-comments-title">
                <h2 id="lost-comments-title" className="flex items-center gap-2 text-[15px] font-bold text-[#293449]">댓글 <span className="text-[#1554ff]">{comments.length}</span></h2>
                {comments.length ? <ul className="mt-1 divide-y divide-[#edf0f5]" aria-label="댓글 목록">{comments.map((comment, index) => <li key={comment.id} ref={index === comments.length - 1 ? lastCommentRef : undefined} className="scroll-mb-44 py-5">
                  <div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-[#f0f4fc] text-[#829aca]"><LostFoundIcon name="user" className="size-4" /></span><span className="text-[13px] font-semibold text-[#364152]">익명</span><time className="ml-auto text-[10px] text-[#9aa3b4]" dateTime={new Date(comment.createdAt).toISOString()}>{formatLostPostTime(comment.createdAt, now)}</time></div>
                  <p className="mt-2.5 text-sm leading-7 whitespace-pre-wrap text-[#414d60]">{comment.content}</p>
                </li>)}</ul> : <div className="py-10 text-center"><LostFoundIcon name="comment" className="mx-auto size-7 text-[#b5c8ed]" /><p className="mt-3 text-sm font-medium text-[#6c7890]">아직 댓글이 없어요</p><p className="mt-1.5 text-xs text-[#9aa3b4]">물건을 찾는 데 도움이 되는 이야기를 남겨주세요.</p></div>}
              </section>
            </>}
    </AppLayout>
  )
}
