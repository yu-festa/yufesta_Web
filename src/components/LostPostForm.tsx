import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import LostFoundIcon from './LostFoundIcon'
import { lostPostLabels, MAX_LOST_PHOTOS, validateLostPost } from '../utils/lostFound'
import type { LostPhoto, LostPost, LostPostKind } from '../utils/lostFound'
import { saveLostPost } from '../utils/lostFoundStorage'
import { prepareLostPhoto } from '../utils/lostFoundPhotos'

export default function LostPostForm({ onRegistered }: { onRegistered: (post: LostPost) => void }) {
  const [kind, setKind] = useState<LostPostKind>('lost')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [content, setContent] = useState('')
  const [photos, setPhotos] = useState<LostPhoto[]>([])
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const busyRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function attachPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length || busyRef.current) return
    setError('')
    if (photos.length + files.length > MAX_LOST_PHOTOS) {
      setError('사진은 최대 5장까지 첨부할 수 있어요. 선택한 사진 수를 줄여 주세요.')
      return
    }
    busyRef.current = true
    setProcessing(true)
    try {
      const additions = await Promise.all(files.map(prepareLostPhoto))
      setPhotos(current => [...current, ...additions])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '사진을 첨부하지 못했어요. 다시 시도해 주세요.')
    } finally {
      busyRef.current = false
      setProcessing(false)
    }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busyRef.current) return
    const draft = { kind, title, location, content, photos }
    const validation = validateLostPost(draft)
    if (validation) { setError(validation); return }
    busyRef.current = true
    setSaving(true)
    setError('')
    try {
      const post = await saveLostPost(draft)
      onRegistered(post)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '등록하지 못했어요. 다시 시도해 주세요.')
      busyRef.current = false
      setSaving(false)
    }
  }

  return (
    <form onSubmit={register} className="mt-7 pb-4" aria-label="분실물 등록" aria-busy={saving || processing}>
      <fieldset disabled={saving} className="space-y-6">
        <fieldset>
          <legend className="mb-3 text-base font-bold">게시글 종류</legend>
          <div className="flex gap-4">
            {(['lost', 'found'] as const).map(value => <button key={value} type="button" className="lost-found__filter lost-found__type" aria-pressed={kind === value} onClick={() => setKind(value)}>{lostPostLabels[value]}</button>)}
          </div>
        </fieldset>
        <div>
          <label className="mb-2 block text-base font-bold" htmlFor="lost-title">제목 <span className="text-[#1554ff]" aria-hidden="true">*</span></label>
          <input className="lost-found__field" id="lost-title" required maxLength={80} value={title} onChange={event => setTitle(event.target.value)} placeholder="어떤 물건을 찾거나 주우셨나요?" />
        </div>
        <div>
          <label className="mb-2 block text-base font-bold" htmlFor="lost-location">{kind === 'lost' ? '분실 장소' : '발견 장소'} <span className="text-[#1554ff]" aria-hidden="true">*</span></label>
          <div className="relative">
            <LostFoundIcon name="pin" className="pointer-events-none absolute top-3 left-3 size-5 text-[#aaa]" />
            <input className="lost-found__field pl-10!" id="lost-location" required maxLength={100} value={location} onChange={event => setLocation(event.target.value)} placeholder="예: 공연장 앞" />
          </div>
        </div>
        <div>
          <p id="lost-photos-label" className="mb-2 text-base font-bold">사진 첨부 <span className="text-sm font-normal text-[#999]">({photos.length}/5)</span></p>
          <div className="flex flex-wrap gap-3" role="group" aria-labelledby="lost-photos-label">
            {photos.map((photo, index) => <div key={photo.id} className="relative size-26">
              <img className="h-full w-full rounded-lg object-cover" src={photo.src} alt={`첨부 사진 ${index + 1}`} />
              <button type="button" disabled={processing} className="absolute -top-2 -right-2 grid size-8 place-items-center rounded-full border-2 border-white bg-[#344054] text-white" aria-label={`사진 ${index + 1} 삭제`} onClick={() => setPhotos(current => current.filter(item => item.id !== photo.id))}><LostFoundIcon name="close" className="size-4" /></button>
            </div>)}
            {photos.length < MAX_LOST_PHOTOS && <button type="button" disabled={processing} className="grid size-26 place-items-center rounded-md bg-[#e9f3ff] text-[#3888ff]" aria-label="사진 첨부" onClick={() => inputRef.current?.click()}><LostFoundIcon name="plus" className="size-11" /></button>}
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={event => void attachPhotos(event)} />
          <p className="mt-2.5 text-[11px] text-[#999]" role={processing ? 'status' : undefined}>{processing ? '사진을 준비하고 있어요…' : '물건 특징이 보이는 사진을 올려주세요 · 최대 5장, 장당 10MB'}</p>
        </div>
        <div>
          <label className="mb-2 block text-base font-bold" htmlFor="lost-content">내용 <span className="text-[#1554ff]" aria-hidden="true">*</span></label>
          <textarea className="lost-found__field min-h-40 resize-y" id="lost-content" required maxLength={3000} value={content} onChange={event => setContent(event.target.value)} placeholder="물건의 특징, 분실·발견 시간 등 자세한 내용을 적어주세요." />
        </div>
      </fieldset>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <button type="submit" disabled={saving || processing} className="mt-10 min-h-12 w-full rounded-lg bg-[#1554ff] px-4 py-3 text-base font-bold text-white">{saving ? '등록 중…' : '등록하기'}</button>
    </form>
  )
}
