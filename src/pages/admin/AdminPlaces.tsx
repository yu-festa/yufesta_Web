import { useAdminAction, useAdminResource } from '../../hooks/useAdminData'
import { useRef, useState } from 'react'
import { createPlace, createPlaceEvent, updatePlace, updatePlaceEvent } from '../../api/admin'
import type { AdminPlace, EventInput, PlaceInput } from '../../api/admin'
import { getPlace, getPlaces, placeCategoryLabels } from '../../api/places'
import type { PlaceDetail, PlaceEvent, ServerPlaceCategory } from '../../api/places'
import { Feedback, Field, ResourceState, SectionHeading } from '../../components/admin/AdminShared'

const categories = placeCategoryLabels
const loadPlaces = () => getPlaces()
type Selection = { detail: PlaceDetail; admin?: AdminPlace }
export default function AdminPlaces() {
  const resource = useAdminResource(loadPlaces)
  const action = useAdminAction()
  const [selected, setSelected] = useState<Selection | null>(null)
  const [editing, setEditing] = useState<Selection | 'new' | null>(null)
  const [eventForm, setEventForm] = useState<PlaceEvent | 'new' | null>(null)
  const saved = useRef(new Map<number, AdminPlace>())
  const editorRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const edit = (value: Selection | 'new') => { setEditing(value); setEventForm(null); requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }
  const open = (id: number) => {
    void action.run(async () => {
      const detail = await getPlace(id)
      setSelected({ detail, admin: saved.current.get(id) })
      setEventForm(null)
      setEditing(null)
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }, '장소 상세를 불러왔어요.')
  }
  const savePlace = (input: PlaceInput) => action.run(async () => {
    const existing = editing === 'new' ? null : editing
    const place = existing ? await updatePlace(existing.detail.id, input) : await createPlace(input)
    saved.current.set(place.id, place)
    setSelected({ detail: { ...place, events: existing?.detail.events ?? [] }, admin: place })
    setEditing(null)
    setEventForm(null)
    await resource.refresh()
  }, '장소를 저장했어요.')
  const saveEvent = (input: EventInput) => action.run(async () => {
    if (!selected || !eventForm) return
    const placeId = selected.detail.id
    const item = eventForm === 'new' ? await createPlaceEvent(placeId, input) : await updatePlaceEvent(placeId, eventForm.id, input)
    setSelected(current => current?.detail.id === placeId ? { ...current, detail: { ...current.detail, events: [...current.detail.events.filter(event => event.id !== item.id), item].sort((a, b) => a.sortOrder - b.sortOrder) } } : current)
    setEventForm(null)
  }, '장소 이벤트를 저장했어요.')
  return <>
    <SectionHeading title="장소 · 이벤트 관리" description="지도에 표시할 장소와 장소별 행사 정보를 관리해요."><button className="admin-button" disabled={action.busy} onClick={() => edit('new')}>+ 장소 등록</button></SectionHeading>
    <Feedback error={action.error} success={action.success} />
    <div className="admin-note">현재는 공개 장소만 조회할 수 있어요. 비공개로 저장한 장소는 이 화면을 떠난 뒤 다시 불러올 수 없으니, 재공개가 필요하면 백엔드 담당자에게 장소 ID를 전달해 주세요.</div>
    <div ref={editorRef}>{editing && <PlaceForm key={editing === 'new' ? 'new' : `${editing.detail.id}`} selection={editing === 'new' ? null : editing} busy={action.busy} onCancel={() => setEditing(null)} onSave={savePlace} />}</div>
    <div className="admin-toolbar"><strong>공개 장소</strong><button className="admin-link" disabled={resource.loading || action.busy} onClick={() => void resource.refresh()}>목록 새로고침</button></div>
    <ResourceState {...resource} onRetry={() => void resource.refresh()} />
    {!resource.loading && !resource.error && <div className="admin-place-grid">{!resource.data?.length && <div className="admin-empty">공개된 장소가 없습니다.</div>}{resource.data?.map(place => <button key={place.id} className={`admin-place-item ${selected?.detail.id === place.id ? 'selected' : ''}`} disabled={action.busy} onClick={() => open(place.id)}><span className="admin-badge">{categories[place.category]}</span><strong>{place.name}</strong><span className="admin-muted">장소 #{place.id} · 상세 보기 →</span></button>)}</div>}
    <div ref={detailRef}>{selected && <section className="admin-card admin-editor">
      <div className="admin-card-title"><h3>{selected.detail.name}</h3><span className="admin-badge blue">{selected.admin?.active === false ? '비공개' : '공개'} · #{selected.detail.id}</span></div>
      <p className="admin-report-body">{selected.detail.description || '등록된 설명이 없습니다.'}</p>
      <dl className="admin-details"><dt>구분</dt><dd>{categories[selected.detail.category]}</dd><dt>건물 / 층</dt><dd>{selected.detail.building || '—'} / {selected.detail.floor || '—'}</dd><dt>좌표</dt><dd>{selected.detail.latitude}, {selected.detail.longitude}</dd></dl>
      <div className="admin-actions"><button className="admin-button secondary" disabled={action.busy} onClick={() => edit(selected)}>장소 수정</button><button className="admin-button" disabled={action.busy} onClick={() => { setEditing(null); setEventForm('new') }}>+ 이벤트 등록</button></div>
      <div className="admin-inset"><h4>장소 이벤트</h4>{!selected.detail.events.length && <p className="admin-muted">등록된 이벤트가 없습니다.</p>}{selected.detail.events.map(event => <div className="admin-event" key={event.id}><div><strong>{event.name}</strong><p>{event.timeText} · 표시 순서 {event.sortOrder}</p></div><button className="admin-link" disabled={action.busy} onClick={() => { setEditing(null); setEventForm(event) }}>수정</button></div>)}</div>
      {eventForm && <EventForm key={`${selected.detail.id}:${eventForm === 'new' ? 'new' : eventForm.id}`} item={eventForm === 'new' ? null : eventForm} busy={action.busy} onCancel={() => setEventForm(null)} onSave={saveEvent} />}
    </section>}</div>
  </>
}

function PlaceForm({ selection, busy, onCancel, onSave }: { selection: Selection | null; busy: boolean; onCancel: () => void; onSave: (input: PlaceInput) => Promise<boolean> }) {
  const source = selection?.detail
  const [form, setForm] = useState({
    name: source?.name ?? '', category: source?.category ?? 'STAGE', latitude: source ? String(source.latitude) : '', longitude: source ? String(source.longitude) : '',
    description: source?.description ?? '', building: source?.building ?? '', floor: source?.floor ?? '',
    sortOrder: selection?.admin ? String(selection.admin.sortOrder) : selection ? '' : '0', active: selection?.admin?.active ?? true,
  })
  return <form className="admin-card admin-editor" onSubmit={event => { event.preventDefault(); if (!form.name.trim()) return; void onSave({ ...form, name: form.name.trim(), latitude: Number(form.latitude), longitude: Number(form.longitude), sortOrder: Number(form.sortOrder) }) }}>
    <h3>{selection ? `장소 #${selection.detail.id} 수정` : '새 장소 등록'}</h3><fieldset disabled={busy}>
      <div className="admin-form-grid"><Field label="장소명"><input required maxLength={50} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></Field><Field label="구분"><select value={form.category} onChange={event => setForm({ ...form, category: event.target.value as ServerPlaceCategory })}>{Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label="위도"><input required type="number" min={-90} max={90} step="any" value={form.latitude} onChange={event => setForm({ ...form, latitude: event.target.value })} /></Field><Field label="경도"><input required type="number" min={-180} max={180} step="any" value={form.longitude} onChange={event => setForm({ ...form, longitude: event.target.value })} /></Field>
      <Field label="건물명"><input maxLength={50} value={form.building} onChange={event => setForm({ ...form, building: event.target.value })} /></Field><Field label="층 / 세부 위치"><input maxLength={20} value={form.floor} onChange={event => setForm({ ...form, floor: event.target.value })} /></Field></div>
      <Field label="설명"><textarea rows={3} maxLength={200} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></Field>
      <Field label="표시 순서" hint={selection && !selection.admin ? '기존 순서는 조회되지 않습니다. 저장할 순서를 직접 입력해 주세요.' : '작은 숫자부터 표시됩니다.'}><input required type="number" step="1" min={-2147483648} max={2147483647} value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: event.target.value })} /></Field>
      <label className="admin-check"><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })} />지도에 공개</label>
      {!form.active && <p className="admin-note">비공개로 저장하면 공개 목록에서 사라집니다. 현재 API에는 비공개 장소 조회 기능이 없습니다.</p>}
      <div className="admin-actions"><button className="admin-button" disabled={!form.name.trim()}>{busy ? '저장 중…' : '장소 저장'}</button><button type="button" className="admin-button secondary" onClick={onCancel}>취소</button></div>
    </fieldset>
  </form>
}

function EventForm({ item, busy, onCancel, onSave }: { item: PlaceEvent | null; busy: boolean; onCancel: () => void; onSave: (input: EventInput) => Promise<boolean> }) {
  const [form, setForm] = useState({ name: item?.name ?? '', timeText: item?.timeText ?? '', sortOrder: String(item?.sortOrder ?? 0) })
  return <form className="admin-inset" onSubmit={event => { event.preventDefault(); if (form.name.trim() && form.timeText.trim()) void onSave({ name: form.name.trim(), timeText: form.timeText.trim(), sortOrder: Number(form.sortOrder) }) }}><h4>{item ? '이벤트 수정' : '이벤트 등록'}</h4><fieldset disabled={busy}>
    <Field label="이벤트명"><input required maxLength={50} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></Field><Field label="시간 안내" hint="예: 10월 2일 18:00 ~ 19:00"><input required maxLength={30} value={form.timeText} onChange={event => setForm({ ...form, timeText: event.target.value })} /></Field><Field label="이벤트 표시 순서"><input required type="number" step="1" min={-2147483648} max={2147483647} value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: event.target.value })} /></Field>
    <div className="admin-actions"><button className="admin-button" disabled={!form.name.trim() || !form.timeText.trim()}>{busy ? '저장 중…' : '이벤트 저장'}</button><button type="button" className="admin-button secondary" onClick={onCancel}>취소</button></div>
  </fieldset></form>
}
