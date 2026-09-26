import { useCallback, useState } from 'react'
import { getLostItemComments } from '../../api/lostItems'
import { setLostItemCommentVisibility } from '../../api/adminContent'
import { useAdminAction, useAdminResource } from '../../hooks/useAdminData'
import { displayAdminTime } from '../../utils/admin'
import { ConfirmDialog, Feedback, ResourceState } from './AdminShared'
import type { Confirmation } from './AdminShared'

export type CommentSelection = { postId?: number; commentId?: number; hidden?: boolean }

export default function AdminLostComments({ selection, onChanged }: { selection: CommentSelection; onChanged: () => Promise<void> }) {
  const [postId, setPostId] = useState(String(selection.postId ?? ''))
  const [commentId, setCommentId] = useState(String(selection.commentId ?? ''))
  const [hidden, setHidden] = useState(selection.hidden ?? false)
  const [loadedId, setLoadedId] = useState(selection.postId ?? null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const load = useCallback(async () => ({ postId: loadedId, comments: loadedId ? await getLostItemComments(loadedId) : [] }), [loadedId])
  const comments = useAdminResource(load)
  const action = useAdminAction()
  const validId = (value: string) => Number.isSafeInteger(Number(value)) && Number(value) > 0
  const changeVisibility = (lostId: number, id: number, nextHidden: boolean) => setConfirmation({
    title: nextHidden ? '댓글을 숨길까요?' : '댓글을 다시 공개할까요?',
    description: `분실물 글 #${lostId}의 댓글 #${id}을 ${nextHidden ? '숨깁니다' : '다시 공개합니다'}.`,
    success: nextHidden ? '댓글을 숨겼어요.' : '댓글을 다시 공개했어요.',
    action: async () => { await setLostItemCommentVisibility(lostId, id, nextHidden); await Promise.all([comments.refresh(), onChanged()]) },
  })
  const rows = (comments.data?.postId === loadedId ? comments.data?.comments ?? [] : []).flatMap(comment => [comment, ...(comment.replies ?? [])])
  return <section className="admin-card admin-editor" aria-labelledby="admin-lost-comments-title">
    <h3 id="admin-lost-comments-title">분실물 댓글 관리</h3>
    <p className="admin-muted">글 번호로 공개 댓글·답글을 조회할 수 있어요. 숨긴 댓글은 글 번호와 댓글 번호를 입력해 다시 공개할 수 있어요.</p>
    {selection.commentId && !selection.postId && <p className="admin-muted">선택한 신고: 댓글 #{selection.commentId}. 신고 목록에는 원글 번호가 없어 해당 분실물 글 번호를 입력해야 해요.</p>}
    <Feedback error={action.error} success={action.success} />
    <form className="admin-toolbar" onSubmit={event => { event.preventDefault(); if (validId(postId)) { if (loadedId === Number(postId)) void comments.refresh(); else setLoadedId(Number(postId)) } }}>
      <label>분실물 글 번호<input required type="number" min="1" step="1" value={postId} disabled={action.busy} onChange={event => setPostId(event.target.value)} /></label>
      <button className="admin-button secondary" disabled={action.busy || !validId(postId)}>댓글 조회</button>
    </form>
    {loadedId && <>
      <h4 className="font-bold">글 #{loadedId}의 댓글·답글</h4>
      <ResourceState {...comments} onRetry={() => void comments.refresh()} />
      {!comments.loading && !comments.error && !rows.length && <p className="admin-muted">공개된 댓글이 없어요.</p>}
      {rows.map(comment => <div key={comment.id} className="admin-event">
        <div className="min-w-0"><strong>#{comment.id} {comment.displayName}{comment.postAuthor ? ' · 원글 작성자' : ''}</strong><p className="whitespace-pre-wrap wrap-anywhere">{comment.deleted ? '삭제된 댓글입니다.' : comment.content}</p><p>{comment.parentId ? `댓글 #${comment.parentId}의 답글 · ` : ''}{displayAdminTime(comment.createdAt)}</p></div>
        {!comment.deleted && <button type="button" className="admin-link shrink-0" disabled={action.busy} onClick={() => changeVisibility(loadedId, comment.id, true)}>숨기기</button>}
      </div>)}
    </>}
    <form className="admin-toolbar" onSubmit={event => { event.preventDefault(); if (validId(postId) && validId(commentId)) changeVisibility(Number(postId), Number(commentId), hidden) }}>
      <label>댓글 번호<input required type="number" min="1" step="1" value={commentId} disabled={action.busy} onChange={event => setCommentId(event.target.value)} /></label>
      <label>공개 상태<select value={String(hidden)} disabled={action.busy} onChange={event => setHidden(event.target.value === 'true')}><option value="true">숨김</option><option value="false">공개</option></select></label>
      <button className="admin-button secondary" disabled={action.busy || !validId(postId) || !validId(commentId)}>글·댓글 번호로 적용</button>
    </form>
    <ConfirmDialog confirmation={confirmation} busy={action.busy} onCancel={() => setConfirmation(null)} onConfirm={() => { if (confirmation) void action.run(confirmation.action, confirmation.success).then(() => setConfirmation(null)) }} />
  </section>
}
