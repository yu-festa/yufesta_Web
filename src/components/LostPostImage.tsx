import { useRef, useState } from 'react'
import { deleteLostItemImage, uploadLostItemImage } from '../api/lostItems'
import type { LostItemImage } from '../api/lostItems'
import LostImagePicker from './LostImagePicker'

export default function LostPostImage({ postId, image, isAuthenticated, onChanged }: { postId: number; image: LostItemImage | null; isAuthenticated: boolean; onChanged: (image: LostItemImage | null) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pickerKey, setPickerKey] = useState(0)
  async function change(remove: boolean) {
    if (lock.current || (remove ? !image : !file)) return
    if (remove && !window.confirm('첨부된 사진을 삭제할까요?')) return
    lock.current = true; setBusy(true); setError(''); setNotice('')
    try {
      if (remove) { await deleteLostItemImage(postId, image!.id); onChanged(null) }
      else { const saved = await uploadLostItemImage(postId, file!); onChanged(saved) }
      setFile(null); setPickerKey(value => value + 1)
      setNotice(remove ? '사진을 삭제했어요.' : '사진을 등록했어요.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : '사진을 저장하지 못했어요.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <>
    {image && <a className="mt-6 block overflow-hidden rounded-2xl bg-[#f5f8ff] focus-visible:outline-2 focus-visible:outline-[#1554ff]" href={image.imageUrl} target="_blank" rel="noopener noreferrer" aria-label="분실물 사진 원본 보기"><img src={image.imageUrl} alt="게시글에 첨부된 분실물 사진" className="max-h-96 w-full object-contain" /></a>}
    {isAuthenticated && <details className="mt-5 rounded-xl border border-[#edf0f5] px-4 py-1">
      <summary className="min-h-11 cursor-pointer py-3 text-xs font-semibold text-[#6c7890]">내 글 사진 관리</summary>
      <div className="pb-3" aria-busy={busy}>
        <p className="mb-3 text-xs leading-5 text-[#929bad]">본인이 작성한 글에 사진 한 장을 등록할 수 있어요. 사진을 바꾸려면 기존 사진을 먼저 삭제해 주세요.</p>
        {image ? <button type="button" disabled={busy} className="min-h-10 rounded-lg border border-[#e5e8ef] px-4 text-xs text-[#6c7890] disabled:opacity-50" onClick={() => void change(true)}>{busy ? '삭제 중…' : '사진 삭제'}</button> : <>
          <LostImagePicker key={pickerKey} disabled={busy} onChange={setFile} />
          <button type="button" disabled={busy || !file} className="mt-3 min-h-10 rounded-lg bg-[#1554ff] px-4 text-sm font-semibold text-white disabled:opacity-50" onClick={() => void change(false)}>{busy ? '등록 중…' : '사진 등록'}</button>
        </>}
        {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
        {notice && <p role="status" className="mt-3 text-xs text-[#1554ff]">{notice}</p>}
      </div>
    </details>}
  </>
}
