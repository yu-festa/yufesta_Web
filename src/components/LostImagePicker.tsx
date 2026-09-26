import { useEffect, useId, useRef, useState } from 'react'
import LostFoundIcon from './LostFoundIcon'
import { validateLostItemImage } from '../utils/lostItemImage'

export default function LostImagePicker({ disabled, onChange }: { disabled: boolean; onChange: (file: File | null) => void }) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const urlRef = useRef<string | null>(null)
  const [selection, setSelection] = useState<{ name: string; url: string } | null>(null)
  const [error, setError] = useState('')
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current) }, [])
  function clear() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    if (inputRef.current) inputRef.current.value = ''
    setSelection(null)
    setError('')
    onChange(null)
  }
  return <div>
    <label htmlFor={id} className="mb-2 block text-base font-bold">사진 <span className="text-sm font-normal text-[#999]">(선택 · 1장)</span></label>
    <p id={`${id}-help`} className="mb-3 text-xs text-[#929bad]">JPG·PNG, 10MB 이하의 사진을 첨부해 주세요.</p>
    {selection && <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#f5f8ff] p-3"><img className="size-24 shrink-0 rounded-lg object-cover" src={selection.url} alt="첨부할 분실물 사진 미리보기" /><div className="min-w-0"><p className="break-all text-xs text-[#667085]">{selection.name}</p><button type="button" disabled={disabled} className="mt-2 min-h-10 text-xs text-[#6c7890] underline" onClick={clear}>선택 취소</button></div></div>}
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#c8d5ed] p-3 text-[#667085]">
      <LostFoundIcon name="photo" className="size-5 shrink-0 text-[#7899dc]" />
      <input ref={inputRef} id={id} type="file" accept="image/jpeg,image/png" disabled={disabled} aria-describedby={`${id}-help`} className="min-w-0 w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf3ff] file:px-3 file:py-2 file:text-[#1554ff]" onChange={event => {
        const file = event.target.files?.[0]
        if (!file) return
        try {
          validateLostItemImage(file)
          const url = URL.createObjectURL(file)
          if (urlRef.current) URL.revokeObjectURL(urlRef.current)
          urlRef.current = url
          setSelection({ name: file.name, url }); setError(''); onChange(file)
        } catch (cause) { event.target.value = ''; setError(cause instanceof Error ? cause.message : '사진을 확인해 주세요.') }
      }} />
    </div>
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </div>
}
