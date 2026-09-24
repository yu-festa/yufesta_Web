import { useState } from 'react'
import type { FormEvent } from 'react'
import { createAdminClub, deleteAdminClub, getAdminClubs, updateAdminClub } from '../../api/adminContent'
import type { AdminClub, ClubInput } from '../../api/adminContent'
import { useAdminAction, useAdminResource } from '../../hooks/useAdminData'
import { ConfirmDialog, Feedback, Field, ResourceState, SectionHeading } from '../../components/admin/AdminShared'
import type { Confirmation } from '../../components/admin/AdminShared'

export default function AdminClubs() {
  const resource = useAdminResource(getAdminClubs)
  const action = useAdminAction()
  const [editing, setEditing] = useState<AdminClub | 'new' | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const clubs = resource.data ?? []
  return <>
    <SectionHeading title="공연 동아리" description="홈과 공연 상세에 표시할 동아리 정보를 관리해요."><button className="admin-button" disabled={action.busy} onClick={() => setEditing('new')}>+ 동아리 등록</button></SectionHeading>
    <Feedback error={action.error} success={action.success} />
    {editing && <ClubEditor key={editing === 'new' ? 'new' : editing.id} club={editing === 'new' ? null : editing} busy={action.busy} onCancel={() => setEditing(null)} onSave={async input => { const ok = await action.run(async () => { if (editing === 'new') await createAdminClub(input); else await updateAdminClub(editing.id, input); await resource.refresh() }, '동아리 정보를 저장했어요.'); if (ok) setEditing(null) }} />}
    <ResourceState {...resource} onRetry={() => void resource.refresh()} />
    {!resource.loading && !resource.error && <div className="admin-grid">{!clubs.length && <div className="admin-empty">등록된 동아리가 없어요.</div>}{clubs.map(club => <article key={club.id} className="admin-card"><div className="admin-card-title"><h3>{club.name}</h3><span className="admin-badge blue">#{club.id}</span></div><p className="admin-report-body">{club.intro}</p><dl className="admin-details"><dt>장르</dt><dd>{club.genre || '—'}</dd><dt>대표곡</dt><dd>{club.signatureSong || '—'}</dd><dt>순서</dt><dd>{club.sortOrder}</dd></dl><div className="admin-actions"><button className="admin-button secondary" disabled={action.busy} onClick={() => setEditing(club)}>수정</button><button className="admin-button danger-outline" disabled={action.busy} onClick={() => setConfirmation({ title: '동아리를 삭제할까요?', description: `“${club.name}” 동아리가 삭제됩니다. 연결된 공연 일정이 있으면 서버에서 거부할 수 있어요.`, success: '동아리를 삭제했어요.', action: async () => { await deleteAdminClub(club.id); await resource.refresh() } })}>삭제</button></div></article>)}</div>}
    <ConfirmDialog confirmation={confirmation} busy={action.busy} onCancel={() => setConfirmation(null)} onConfirm={() => { if (confirmation) void action.run(confirmation.action, confirmation.success).then(() => setConfirmation(null)) }} />
  </>
}

function ClubEditor({ club, busy, onCancel, onSave }: { club: AdminClub | null; busy: boolean; onCancel: () => void; onSave: (input: ClubInput) => Promise<void> }) {
  const [form, setForm] = useState({ name: club?.name ?? '', intro: club?.intro ?? '', genre: club?.genre ?? '', signatureSong: club?.signatureSong ?? '', instagramUrl: club?.instagramUrl ?? '', photoUrl: club?.photoUrl ?? '', sortOrder: String(club?.sortOrder ?? 0) })
  const submit = (event: FormEvent) => { event.preventDefault(); void onSave({ name: form.name.trim(), intro: form.intro.trim(), genre: form.genre.trim() || null, signatureSong: form.signatureSong.trim() || null, instagramUrl: form.instagramUrl.trim() || null, photoUrl: form.photoUrl.trim() || null, sortOrder: Number(form.sortOrder) }) }
  return <form className="admin-card admin-editor" onSubmit={submit}><h3>{club ? `동아리 #${club.id} 수정` : '새 동아리'}</h3><fieldset disabled={busy}><div className="admin-form-grid"><Field label="동아리명"><input required maxLength={50} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></Field><Field label="장르"><input maxLength={30} value={form.genre} onChange={event => setForm({ ...form, genre: event.target.value })} /></Field><Field label="대표곡"><input maxLength={50} value={form.signatureSong} onChange={event => setForm({ ...form, signatureSong: event.target.value })} /></Field><Field label="표시 순서"><input required type="number" step="1" value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: event.target.value })} /></Field></div><Field label="한 줄 소개"><textarea required maxLength={200} rows={3} value={form.intro} onChange={event => setForm({ ...form, intro: event.target.value })} /></Field><Field label="인스타그램 주소"><input type="url" maxLength={200} pattern="https://(www\.)?instagram\.com/.+" placeholder="https://www.instagram.com/..." value={form.instagramUrl} onChange={event => setForm({ ...form, instagramUrl: event.target.value })} /></Field><Field label="대표 사진 주소" hint="사진 업로드 API가 없어 이미지 URL을 입력합니다."><input type="url" maxLength={500} value={form.photoUrl} onChange={event => setForm({ ...form, photoUrl: event.target.value })} /></Field><div className="admin-actions"><button className="admin-button" disabled={!form.name.trim() || !form.intro.trim()}>저장</button><button type="button" className="admin-button secondary" onClick={onCancel}>취소</button></div></fieldset></form>
}
