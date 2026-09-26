import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import LostFoundIcon from './LostFoundIcon'
import { createLostItem, uploadLostItemImage } from '../api/lostItems'
import LostImagePicker from './LostImagePicker'
import type { LostItem, LostItemKind } from '../api/lostItems'
import { composeLostItemDescription, lostItemLabels, MAX_LOST_DESCRIPTION } from '../utils/lostItemDisplay'

const fieldClass = 'block w-full min-h-[42px] rounded-[8px] border border-[#dedede] bg-white px-[13px] py-[10px] text-[14px] leading-[1.5] placeholder:text-[#aaa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1554ff]'

export default function LostPostForm({ onRegistered }: { onRegistered: (post: LostItem) => void }) {
  const [kind, setKind] = useState<LostItemKind>('LOST')
  const [title, setTitle] = useState('')
  const [placeText, setPlaceText] = useState('')
  const [body, setBody] = useState('')
  const [occurredAt, setOccurredAt] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [createdPost, setCreatedPost] = useState<LostItem | null>(null)
  const busy = useRef(false)
  const descriptionLength = title.trim().length + body.trim().length + (title.trim() && body.trim() ? 1 : 0)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    let description: string
    try { description = composeLostItemDescription(title, body) }
    catch (reason) { setError(reason instanceof Error ? reason.message : '제목과 내용을 확인해 주세요.'); return }
    if (!placeText.trim()) { setError('장소를 입력해 주세요.'); return }
    busy.current = true
    setSaving(true)
    setError('')
    try {
      // 글 저장 후 사진만 실패하면 같은 글에 사진만 다시 올립니다.
      const post = createdPost ?? await createLostItem({ kind, description, placeText: placeText.trim(), occurredAt: occurredAt ? `${occurredAt}:00` : null })
      setCreatedPost(post)
      if (file) {
        try {
          const image = await uploadLostItemImage(post.id, file)
          onRegistered({ ...post, image })
        } catch (reason) {
          setError(`글은 등록됐지만 사진을 저장하지 못했어요. ${reason instanceof Error ? reason.message : '다시 시도해 주세요.'}`)
        }
      } else onRegistered(post)
    } catch (reason) { setError(reason instanceof Error ? reason.message : '게시글을 등록하지 못했어요.') }
    finally { busy.current = false; setSaving(false) }
  }

  return <form onSubmit={submit} className="mt-7 pb-4" aria-label="분실물 등록" aria-busy={saving}>
    <fieldset disabled={saving || !!createdPost} className="space-y-6">
      <fieldset><legend className="mb-3 text-base font-bold">게시글 종류</legend><div className="flex gap-4">{(['LOST', 'FOUND'] as const).map(value => <button key={value} type="button" className={`min-h-10 min-w-24 rounded-[7px] border px-[15px] py-[5px] text-[14px] font-semibold ${kind === value ? 'border-[#1554ff] bg-[#1554ff] text-white' : 'border-[#ddd] bg-white'}`} aria-pressed={kind === value} onClick={() => setKind(value)}>{lostItemLabels[value]}</button>)}</div></fieldset>
      <div><label htmlFor="lost-title" className="mb-2 block text-base font-bold">제목 <span className="text-[#1554ff]">*</span></label><input id="lost-title" className={fieldClass} required maxLength={80} value={title} onChange={event => setTitle(event.target.value)} placeholder="어떤 물건을 찾거나 주우셨나요?" /></div>
      <div><label htmlFor="lost-location" className="mb-2 block text-base font-bold">{kind === 'LOST' ? '분실 장소' : '발견 장소'} <span className="text-[#1554ff]">*</span></label><div className="relative"><LostFoundIcon name="pin" className="pointer-events-none absolute top-3 left-3 size-5 text-[#aaa]" /><input id="lost-location" className={`${fieldClass} pl-10`} required maxLength={50} value={placeText} onChange={event => setPlaceText(event.target.value)} placeholder="예: 공연장 앞" /></div></div>
      <div><label htmlFor="lost-content" className="mb-2 block text-base font-bold">내용 <span className="text-[#1554ff]">*</span></label><textarea id="lost-content" className={`${fieldClass} min-h-40 resize-y`} required value={body} onChange={event => setBody(event.target.value)} placeholder="물건의 특징을 자세히 적어주세요." /><p className={`mt-2 text-right text-[11px] ${descriptionLength > MAX_LOST_DESCRIPTION ? 'text-red-700' : 'text-[#999]'}`}>제목과 내용 합계 {descriptionLength}/{MAX_LOST_DESCRIPTION}자</p></div>
      <div><label htmlFor="lost-occurred" className="mb-2 block text-base font-bold">{kind === 'LOST' ? '분실 시각' : '발견 시각'} <span className="text-sm font-normal text-[#999]">(선택)</span></label><input id="lost-occurred" type="datetime-local" className={fieldClass} value={occurredAt} onChange={event => setOccurredAt(event.target.value)} /></div>
    </fieldset>
    <div className="mt-6"><LostImagePicker disabled={saving} onChange={setFile} /></div>
    {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
    {createdPost && <p className="mt-3 text-xs leading-5 text-[#78869d]">게시글은 이미 저장됐어요. 사진만 다시 등록하거나 사진 없이 완료할 수 있어요.</p>}
    <button type="submit" disabled={saving || !title.trim() || !body.trim() || !placeText.trim() || descriptionLength > MAX_LOST_DESCRIPTION} className="mt-10 min-h-12 w-full rounded-lg bg-[#1554ff] px-4 py-3 text-base font-bold text-white disabled:opacity-50">{saving ? '등록 중…' : createdPost ? file ? '사진 다시 등록' : '완료하기' : '등록하기'}</button>
    {createdPost && file && <button type="button" disabled={saving} className="mt-3 min-h-11 w-full text-sm text-[#6c7890] underline" onClick={() => onRegistered(createdPost)}>사진 없이 완료하기</button>}
  </form>
}
