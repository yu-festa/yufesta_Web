import { useAdminAction, useAdminResource } from '../../hooks/useAdminData'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createNotice, deleteNotice, getNotice, getNotices, updateNotice } from '../../api/admin'
import type { Notice, NoticeInput } from '../../api/admin'
import { displayAdminTime } from '../../utils/admin'
import { ConfirmDialog, Feedback, Field, ResourceState, SectionHeading } from '../../components/admin/AdminShared'
import type { Confirmation } from '../../components/admin/AdminShared'

export default function AdminNotices() {
  const resource = useAdminResource(getNotices)
  const action = useAdminAction()
  const [editing, setEditing] = useState<Notice | 'new' | null>(null)
  const [lookupId, setLookupId] = useState('')
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const requestDelete = (notice: Notice) => setConfirmation({ title: '공지를 삭제할까요?', description: `“${notice.title}” 공지가 삭제됩니다.`, success: '공지를 삭제했어요.', action: async () => { await deleteNotice(notice.id); if (editing !== 'new' && editing?.id === notice.id) setEditing(null); await resource.refresh() } })
  const edit = (notice: Notice | 'new') => { setEditing(notice); requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }
  const lookup = (event: FormEvent) => { event.preventDefault(); void action.run(async () => edit(await getNotice(Number(lookupId))), '공지를 불러왔어요.') }
  return <>
    <SectionHeading title="공지 관리" description="축제 안내와 홈 긴급 배너에 사용할 공지를 관리해요."><button className="admin-button" disabled={action.busy} onClick={() => edit('new')}>+ 공지 등록</button></SectionHeading>
    <Feedback error={action.error} success={action.success} />
    <div ref={formRef}>{editing && <NoticeForm key={editing === 'new' ? 'new' : editing.id} notice={editing === 'new' ? null : editing} busy={action.busy} onCancel={() => setEditing(null)} onDelete={() => { if (editing !== 'new') requestDelete(editing) }} onSave={body => action.run(async () => { if (editing === 'new') await createNotice(body); else await updateNotice(editing.id, body); setEditing(null); await resource.refresh() }, '공지를 저장했어요.')} />}</div>
    <form className="admin-toolbar" onSubmit={lookup}><label>공지 ID <input type="number" min="1" step="1" required value={lookupId} onChange={event => setLookupId(event.target.value)} placeholder="공지 번호" /></label><button className="admin-button secondary" disabled={action.busy}>불러오기</button><button type="button" className="admin-link" disabled={resource.loading || action.busy} onClick={() => void resource.refresh()}>목록 새로고침</button></form>
    <p className="admin-muted">최근 50건을 표시합니다. 이전 공지는 ID로 불러올 수 있어요.</p>
    <ResourceState {...resource} onRetry={() => void resource.refresh()} />
    {!resource.loading && !resource.error && <div className="admin-list">{!resource.data?.length && <div className="admin-empty">등록된 공지가 없습니다.</div>}{resource.data?.map(notice => <article key={notice.id} className="admin-card">
      <div className="admin-card-title"><h3>{notice.title}</h3>{notice.banner && <span className="admin-badge blue">긴급 배너</span>}</div><p className="admin-muted">#{notice.id} · {displayAdminTime(notice.createdAt)}</p><p className="admin-report-body">{notice.body}</p>
      <div className="admin-actions"><button className="admin-button secondary" disabled={action.busy} onClick={() => edit(notice)}>수정</button><button className="admin-button danger-outline" disabled={action.busy} onClick={() => requestDelete(notice)}>삭제</button></div>
    </article>)}</div>}
    <ConfirmDialog confirmation={confirmation} busy={action.busy} onCancel={() => setConfirmation(null)} onConfirm={() => { if (confirmation) void action.run(confirmation.action, confirmation.success).then(() => setConfirmation(null)) }} />
  </>
}

function NoticeForm({ notice, busy, onSave, onCancel, onDelete }: { notice: Notice | null; busy: boolean; onSave: (body: NoticeInput) => Promise<boolean>; onCancel: () => void; onDelete: () => void }) {
  const [form, setForm] = useState<NoticeInput>(notice ?? { title: '', body: '', banner: false })
  return <form className="admin-card admin-editor" onSubmit={event => { event.preventDefault(); if (form.title.trim() && form.body.trim()) void onSave({ title: form.title.trim(), body: form.body.trim(), banner: form.banner }) }}><h3>{notice ? `공지 #${notice.id} 수정` : '새 공지 등록'}</h3><fieldset disabled={busy}>
    <Field label="제목"><input required maxLength={100} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></Field>
    <Field label="본문"><textarea required rows={6} value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} /></Field>
    <label className="admin-check"><input type="checkbox" checked={form.banner} onChange={event => setForm({ ...form, banner: event.target.checked })} />홈 긴급 배너로 노출</label>
    <div className="admin-actions"><button className="admin-button" disabled={!form.title.trim() || !form.body.trim()}>{busy ? '저장 중…' : '공지 저장'}</button><button type="button" className="admin-button secondary" onClick={onCancel}>취소</button>{notice && <button type="button" className="admin-button danger-outline" onClick={onDelete}>이 공지 삭제</button>}</div>
  </fieldset></form>
}
