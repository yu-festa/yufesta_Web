import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAdminAction, useAdminResource } from '../../hooks/useAdminData'
import { getAdminTimetable, createTimetableSlot, updateTimetableSlot, changeTimetableSlotTimes, setTimetableSlotLive, setTimetableSlotDelay, reorderTimetableSlots, deleteTimetableSlot, getAdminClubs } from '../../api/adminContent'
import type { AdminTimetableSlot } from '../../api/adminContent'
import type { SlotType } from '../../api/timetable'
import { getPlaces } from '../../api/places'
import { displayAdminTime, toKoreanInput } from '../../utils/admin'
import { ConfirmDialog, Feedback, Field, ResourceState, SectionHeading } from '../../components/admin/AdminShared'
import type { Confirmation } from '../../components/admin/AdminShared'

export default function AdminTimetable() {
  const resource = useAdminResource(getAdminTimetable)
  const clubs = useAdminResource(getAdminClubs)
  const places = useAdminResource(getPlaces)
  const action = useAdminAction()
  const [editing, setEditing] = useState<AdminTimetableSlot | 'new' | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const slots = resource.data ?? []
  const stages = (places.data ?? []).filter(place => place.category === 'STAGE')

  const run = (work: () => Promise<unknown>, success: string) => action.run(async () => { await work(); await resource.refresh() }, success)
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= slots.length) return
    const ids = slots.map(slot => slot.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    void run(() => reorderTimetableSlots(ids), '표시 순서를 변경했어요.')
  }

  return <>
    <SectionHeading title="축제 타임테이블" description="공연 시간, LIVE 표시, 지연과 노출 순서를 관리해요."><button className="admin-button" disabled={action.busy} onClick={() => setEditing('new')}>+ 일정 등록</button></SectionHeading>
    <p className="admin-note">LIVE 수동 지정은 서버의 자동 시각 판정을 덮어씁니다. 현재 API에는 수동 지정을 지우고 자동 판정으로 되돌리는 요청이 없습니다.</p>
    <Feedback error={action.error} success={action.success} />
    {editing && <TimetableEditor key={editing === 'new' ? 'new' : editing.id} slot={editing === 'new' ? null : editing} stages={stages} clubs={clubs.data ?? []} busy={action.busy} onCancel={() => setEditing(null)} onSave={async input => {
      const ok = await action.run(async () => {
        if (editing === 'new') await createTimetableSlot({ ...input, sortOrder: Math.max(-1, ...slots.map(slot => slot.sortOrder)) + 1 })
        else { await updateTimetableSlot(editing.id, { title: input.title, slotType: input.slotType, stagePlaceId: input.stagePlaceId, clubId: input.clubId }); if (input.startAt !== toKoreanInput(editing.startAt) || input.endAt !== toKoreanInput(editing.endAt)) await changeTimetableSlotTimes(editing.id, input.startAt, input.endAt) }
        await resource.refresh()
      }, '일정을 저장했어요.')
      if (ok) setEditing(null)
    }} />}
    <ResourceState {...resource} onRetry={() => void resource.refresh()} />
    {!resource.loading && !resource.error && <div className="admin-list">{!slots.length && <div className="admin-empty">등록된 일정이 없어요.</div>}{slots.map((slot, index) => <article className="admin-card" key={slot.id}>
      <div className="admin-card-title"><h3>{slot.title}</h3><span className="admin-badge blue">{slot.slotType}</span></div>
      <p className="admin-muted">#{slot.id} · {slot.stageName} · {slot.clubName ?? '동아리 연결 없음'}</p>
      <dl className="admin-details"><dt>공연 시간</dt><dd>{displayAdminTime(slot.startAt)} ~ {displayAdminTime(slot.endAt)}</dd><dt>진행 수동 지정</dt><dd>{slot.liveOverride === null ? '자동' : slot.liveOverride ? 'LIVE' : '진행 아님'}</dd><dt>지연</dt><dd>{slot.delayMinutes === null ? '없음' : `${slot.delayMinutes}분`}</dd><dt>순서</dt><dd>{slot.sortOrder}</dd></dl>
      <div className="admin-actions"><button className="admin-button secondary" disabled={action.busy || index === 0} onClick={() => move(index, -1)}>위로</button><button className="admin-button secondary" disabled={action.busy || index === slots.length - 1} onClick={() => move(index, 1)}>아래로</button><button className="admin-button secondary" disabled={action.busy} onClick={() => setEditing(slot)}>수정</button><button className="admin-button secondary" disabled={action.busy || slot.liveOverride === true} onClick={() => void run(() => setTimetableSlotLive(slot.id, true), 'LIVE로 지정했어요.')}>LIVE 지정</button><button className="admin-button secondary" disabled={action.busy || slot.liveOverride === false} onClick={() => void run(() => setTimetableSlotLive(slot.id, false), '진행 아님으로 지정했어요.')}>진행 아님 지정</button><button className="admin-button danger-outline" disabled={action.busy} onClick={() => setConfirmation({ title: '일정을 삭제할까요?', description: `“${slot.title}” 일정이 삭제됩니다.`, success: '일정을 삭제했어요.', action: async () => { await deleteTimetableSlot(slot.id); await resource.refresh() } })}>삭제</button></div>
      <form className="admin-toolbar" onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const value = (new FormData(form).get('delay') ?? '').toString(); void run(() => setTimetableSlotDelay(slot.id, value === '' ? null : Number(value)), '지연 시간을 저장했어요.') }}><label>지연 시간(분)<input name="delay" type="number" min="0" max="600" step="1" defaultValue={slot.delayMinutes ?? ''} placeholder="없음" /></label><button className="admin-button secondary" disabled={action.busy}>지연 적용</button></form>
    </article>)}</div>}
    <ConfirmDialog confirmation={confirmation} busy={action.busy} onCancel={() => setConfirmation(null)} onConfirm={() => { if (confirmation) void action.run(confirmation.action, confirmation.success).then(() => setConfirmation(null)) }} />
  </>
}

type EditorInput = { title: string; slotType: SlotType; startAt: string; endAt: string; stagePlaceId: number; clubId: number | null }
function TimetableEditor({ slot, stages, clubs, busy, onCancel, onSave }: { slot: AdminTimetableSlot | null; stages: { id: number; name: string }[]; clubs: { id: number; name: string }[]; busy: boolean; onCancel: () => void; onSave: (input: EditorInput) => Promise<void> }) {
  const [title, setTitle] = useState(slot?.title ?? '')
  const [slotType, setSlotType] = useState<SlotType>(slot?.slotType ?? 'CLUB')
  const [startAt, setStartAt] = useState(toKoreanInput(slot?.startAt ?? ''))
  const [endAt, setEndAt] = useState(toKoreanInput(slot?.endAt ?? ''))
  const [stagePlaceId, setStagePlaceId] = useState(String(slot?.stagePlaceId ?? ''))
  const [clubId, setClubId] = useState(String(slot?.clubId ?? ''))
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (new Date(startAt).getTime() >= new Date(endAt).getTime()) { setError('종료 시각은 시작 시각보다 늦어야 해요.'); return }
    setError('')
    void onSave({ title: title.trim(), slotType, startAt, endAt, stagePlaceId: Number(stagePlaceId), clubId: clubId ? Number(clubId) : null })
  }
  return <form className="admin-card admin-editor" onSubmit={submit}><h3>{slot ? `일정 #${slot.id} 수정` : '새 일정'}</h3><fieldset disabled={busy}><div className="admin-form-grid"><Field label="공연명"><input required maxLength={50} value={title} onChange={event => setTitle(event.target.value)} /></Field><Field label="구분"><select value={slotType} onChange={event => setSlotType(event.target.value as SlotType)}><option value="CLUB">동아리</option><option value="GUEST">초청 공연</option><option value="EVENT">행사</option></select></Field><Field label="시작 시각 (한국 시간)"><input required type="datetime-local" step="1" value={startAt} onChange={event => setStartAt(event.target.value)} /></Field><Field label="종료 시각 (한국 시간)"><input required type="datetime-local" step="1" value={endAt} onChange={event => setEndAt(event.target.value)} /></Field><Field label="공연장" hint="등록된 공개 무대를 선택하거나 장소 ID를 입력해 주세요."><input required type="number" min="1" list="stage-options" value={stagePlaceId} onChange={event => setStagePlaceId(event.target.value)} /><datalist id="stage-options">{stages.map(place => <option key={place.id} value={place.id} label={place.name} />)}</datalist></Field><Field label="동아리 (선택)"><select value={clubId} onChange={event => setClubId(event.target.value)}><option value="">연결하지 않음</option>{clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}</select></Field></div><Feedback error={error} /><div className="admin-actions"><button className="admin-button" disabled={!title.trim() || !stagePlaceId}>저장</button><button type="button" className="admin-button secondary" onClick={onCancel}>취소</button></div></fieldset></form>
}
