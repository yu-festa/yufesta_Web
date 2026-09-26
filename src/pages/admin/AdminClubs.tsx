import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createAdminClub, deleteAdminClub, deleteAdminClubPhoto, getAdminClubs, updateAdminClub, uploadAdminClubPhoto } from '../../api/adminContent'
import type { AdminClub, ClubInput } from '../../api/adminContent'
import { useAdminAction, useAdminResource } from '../../hooks/useAdminData'
import { ConfirmDialog, Feedback, Field, ResourceState, SectionHeading } from '../../components/admin/AdminShared'
import type { Confirmation } from '../../components/admin/AdminShared'
import { validateClubPhoto } from '../../utils/clubPhoto'

export default function AdminClubs() {
  const resource = useAdminResource(getAdminClubs)
  const action = useAdminAction()
  const [editing, setEditing] = useState<AdminClub | 'new' | null>(null)
  const [photoClub, setPhotoClub] = useState<AdminClub | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const clubs = resource.data ?? []
  const revealEditor = () => requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  const edit = (club: AdminClub | 'new') => { setEditing(club); setPhotoClub(null); revealEditor() }
  const editPhoto = (club: AdminClub) => { setPhotoClub(club); setEditing(null); revealEditor() }
  const save = async (input: ClubInput) => {
    if (!editing) return
    await action.run(async () => {
      const saved = editing === 'new' ? await createAdminClub(input) : await updateAdminClub(editing.id, input)
      setEditing(null)
      if (editing === 'new') { setPhotoClub(saved); revealEditor() }
      await resource.refresh()
    }, editing === 'new' ? '동아리를 등록했어요. 대표 사진을 추가해 주세요.' : '동아리 정보를 저장했어요.')
  }
  const uploadPhoto = async (file: File) => {
    if (!photoClub) return
    await action.run(async () => {
      await uploadAdminClubPhoto(photoClub.id, file)
      setPhotoClub(null)
      await resource.refresh()
    }, '대표 사진을 저장했어요.')
  }
  const removePhoto = () => {
    if (!photoClub) return
    const club = photoClub
    setConfirmation({
      title: '대표 사진을 삭제할까요?',
      description: '“' + club.name + '”의 대표 사진이 메인과 공연 상세에서 제거됩니다. 동아리 정보는 유지됩니다.',
      success: '대표 사진을 삭제했어요.',
      action: async () => { await deleteAdminClubPhoto(club.id); setPhotoClub(null); await resource.refresh() },
    })
  }
  return <>
    <SectionHeading title="공연 동아리" description="홈과 공연 상세에 표시할 동아리 정보와 대표 사진을 관리해요."><button className="admin-button" disabled={action.busy} onClick={() => edit('new')}>+ 동아리 등록</button></SectionHeading>
    <Feedback error={action.error} success={action.success} />
    <div ref={editorRef} className="admin-editor">
      {editing && <ClubEditor key={editing === 'new' ? 'new' : editing.id} club={editing === 'new' ? null : editing} busy={action.busy} onCancel={() => setEditing(null)} onSave={save} />}
      {photoClub && <ClubPhotoEditor key={photoClub.id} club={photoClub} busy={action.busy} onCancel={() => setPhotoClub(null)} onUpload={uploadPhoto} onDelete={removePhoto} />}
    </div>
    <ResourceState {...resource} onRetry={() => void resource.refresh()} />
    {!resource.loading && !resource.error && <div className="admin-grid">
      {!clubs.length && <div className="admin-empty">등록된 동아리가 없어요.</div>}
      {clubs.map(club => <article key={club.id} className="admin-card">
        <div className="admin-card-title"><h3>{club.name}</h3><span className="admin-badge blue">#{club.id}</span></div>
        <div className="admin-club-summary">
          <div className="admin-club-thumbnail">{club.photoUrl ? <img src={club.photoUrl} alt={club.name + ' 대표 사진'} loading="lazy" /> : <span>사진 없음</span>}</div>
          <p className="admin-report-body">{club.intro}</p>
        </div>
        <dl className="admin-details"><dt>장르</dt><dd>{club.genre || '—'}</dd><dt>대표곡</dt><dd>{club.signatureSong || '—'}</dd><dt>순서</dt><dd>{club.sortOrder}</dd></dl>
        <div className="admin-actions">
          <button className="admin-button secondary" disabled={action.busy} onClick={() => edit(club)}>정보 수정</button>
          <button className="admin-button secondary" disabled={action.busy} onClick={() => editPhoto(club)}>대표 사진</button>
          <button className="admin-button danger-outline" disabled={action.busy} onClick={() => setConfirmation({ title: '동아리를 삭제할까요?', description: '“' + club.name + '” 동아리가 삭제됩니다. 연결된 공연 일정은 유지되고 동아리 연결만 해제됩니다.', success: '동아리를 삭제했어요.', action: async () => { await deleteAdminClub(club.id); if (editing !== 'new' && editing?.id === club.id) setEditing(null); if (photoClub?.id === club.id) setPhotoClub(null); await resource.refresh() } })}>삭제</button>
        </div>
      </article>)}
    </div>}
    <ConfirmDialog confirmation={confirmation} busy={action.busy} onCancel={() => setConfirmation(null)} onConfirm={() => { if (confirmation) void action.run(confirmation.action, confirmation.success).then(() => setConfirmation(null)) }} />
  </>
}

function ClubEditor({ club, busy, onCancel, onSave }: { club: AdminClub | null; busy: boolean; onCancel: () => void; onSave: (input: ClubInput) => Promise<void> }) {
  const [form, setForm] = useState({ name: club?.name ?? '', intro: club?.intro ?? '', genre: club?.genre ?? '', signatureSong: club?.signatureSong ?? '', instagramUrl: club?.instagramUrl ?? '', sortOrder: String(club?.sortOrder ?? 0) })
  const submit = (event: FormEvent) => { event.preventDefault(); void onSave({ name: form.name.trim(), intro: form.intro.trim(), genre: form.genre.trim() || null, signatureSong: form.signatureSong.trim() || null, instagramUrl: form.instagramUrl.trim() || null, sortOrder: Number(form.sortOrder) }) }
  return <form className="admin-card" onSubmit={submit}>
    <h3>{club ? '동아리 #' + club.id + ' 수정' : '새 동아리'}</h3>
    {!club && <p className="admin-muted">동아리 정보를 저장한 뒤 대표 사진을 추가할 수 있어요.</p>}
    <fieldset disabled={busy}>
      <div className="admin-form-grid">
        <Field label="동아리명"><input required maxLength={50} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="장르"><input maxLength={30} value={form.genre} onChange={event => setForm({ ...form, genre: event.target.value })} /></Field>
        <Field label="대표곡"><input maxLength={50} value={form.signatureSong} onChange={event => setForm({ ...form, signatureSong: event.target.value })} /></Field>
        <Field label="표시 순서"><input required type="number" step="1" min={-2147483648} max={2147483647} value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: event.target.value })} /></Field>
      </div>
      <Field label="한 줄 소개"><textarea required maxLength={200} rows={3} value={form.intro} onChange={event => setForm({ ...form, intro: event.target.value })} /></Field>
      <Field label="인스타그램 주소"><input type="url" maxLength={200} pattern="https://(www\.)?instagram\.com/.+" placeholder="https://www.instagram.com/..." value={form.instagramUrl} onChange={event => setForm({ ...form, instagramUrl: event.target.value })} /></Field>
      <div className="admin-actions"><button className="admin-button" disabled={!form.name.trim() || !form.intro.trim()}>{busy ? '저장 중…' : '저장'}</button><button type="button" className="admin-button secondary" onClick={onCancel}>취소</button></div>
    </fieldset>
  </form>
}

function ClubPhotoEditor({ club, busy, onCancel, onUpload, onDelete }: { club: AdminClub; busy: boolean; onCancel: () => void; onUpload: (file: File) => Promise<void>; onDelete: () => void }) {
  const [selection, setSelection] = useState<{ file: File; url: string } | null>(null)
  const previewRef = useRef<string | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current) }, [])
  const clearFile = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = null
    setSelection(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }
  const file = selection?.file
  const preview = selection?.url ?? club.photoUrl
  return <form className="admin-card" onSubmit={event => { event.preventDefault(); if (file) void onUpload(file) }} aria-busy={busy}>
    <div className="admin-card-title"><h3>{club.name} · 대표 사진</h3><span className="admin-badge blue">#{club.id}</span></div>
    <p className="admin-muted">메인 공연 라인업과 공연 상세에 표시되는 사진이에요. 새 사진을 저장하면 기존 사진을 교체해요.</p>
    <div className="admin-photo-layout">
      <div className="admin-photo-preview">{preview ? <img src={preview} alt={club.name + (file ? ' 선택한 사진 미리보기' : ' 현재 대표 사진')} /> : <span>대표 사진을 추가해 주세요</span>}</div>
      <fieldset disabled={busy}>
        <Field label="사진 선택" hint="JPG·PNG, 최대 10MB. 선택한 사진은 저장을 눌러야 반영돼요.">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png" onChange={event => {
            const next = event.target.files?.[0]
            if (!next) return
            try {
              validateClubPhoto(next)
              const url = URL.createObjectURL(next)
              if (previewRef.current) URL.revokeObjectURL(previewRef.current)
              previewRef.current = url
              setSelection({ file: next, url })
              setError('')
            } catch (reason) { clearFile(); setError(reason instanceof Error ? reason.message : '사진을 확인해 주세요.') }
          }} />
        </Field>
        <Feedback error={error} />
        {file && <p className="admin-muted">선택한 파일: {file.name}<br />{(file.size / 1024 / 1024).toFixed(2)}MB · 저장 전</p>}
        <div className="admin-actions">
          <button className="admin-button" disabled={!file || busy}>{busy ? '처리 중…' : '사진 저장'}</button>
          {file && <button type="button" className="admin-button secondary" onClick={clearFile}>선택 취소</button>}
          <button type="button" className="admin-button secondary" onClick={onCancel}>닫기</button>
        </div>
        {club.photoUrl && <div className="admin-actions"><button type="button" className="admin-button danger-outline" onClick={onDelete}>현재 대표 사진 삭제</button></div>}
      </fieldset>
    </div>
  </form>
}
