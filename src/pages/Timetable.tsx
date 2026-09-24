import { useEffect, useRef, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import TimetableChart from '../components/TimetableChart'
import { getTimetable } from '../api/timetable'
import { usePublicResource } from '../hooks/usePublicResource'
import { formatContentTime } from '../utils/publicContent'
import { festivalTitle } from '../data/timetable'

const buttonClass = 'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1554ff] disabled:cursor-wait disabled:opacity-40'

export default function Timetable({ onBack, onHome }: { onBack: () => void; onHome: () => void }) {
  const resource = usePublicResource(getTimetable)
  const refresh = resource.refresh
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const savingRef = useRef(false)
  const slots = resource.data?.slots ?? []
  const changedSlots = slots.filter(slot => slot.isChanged)

  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, 60_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function saveImage() {
    if (savingRef.current || !slots.length) return
    savingRef.current = true
    setSaving(true)
    setMessage('이미지를 만들고 있어요.')
    try {
      const { downloadTimetableImage } = await import('../utils/timetableImage')
      await downloadTimetableImage(slots)
      setMessage('PNG 이미지 다운로드를 시작했어요.')
    } catch { setMessage('이미지를 저장하지 못했어요. 다시 시도해 주세요.') }
    finally { savingRef.current = false; setSaving(false) }
  }

  return <AppLayout padded={false} header={<div className="flex h-22 items-center"><HomeLogo onHome={onHome} /></div>}>
    <section className="pb-3 text-[#111]" aria-labelledby="timetable-heading">
      <div className="grid min-h-12 grid-cols-[44px_minmax(0,1fr)_44px] items-center px-1">
        <button className={buttonClass} onClick={onBack} aria-label="메인으로 돌아가기"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg></button>
        <h1 id="timetable-heading" className="text-center text-[clamp(16px,4.8vw,20px)] leading-snug font-medium tracking-[-0.5px]">{festivalTitle}</h1>
      </div>
      <div className="flex min-h-14 items-center justify-end px-1">
        <p role="status" className="px-2 text-right text-xs break-keep text-[#666]">{message}</p>
        <button className={buttonClass} onClick={() => void saveImage()} disabled={saving || !slots.length} aria-label={saving ? '타임테이블 이미지 저장 중' : '타임테이블 이미지 저장'} aria-busy={saving}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 14v6h14v-6" /></svg></button>
      </div>
      {resource.loading && !resource.data && <p role="status" className="py-14 text-center text-sm text-[#77849a]">일정을 불러오고 있어요…</p>}
      {resource.error && <div role="alert" className="mx-4 rounded-xl bg-red-50 p-5 text-sm text-red-700">{resource.error}<button className="ml-3 underline" onClick={() => void resource.refresh()}>다시 불러오기</button></div>}
      {!resource.loading && !resource.error && !slots.length && <p className="mx-4 rounded-xl bg-[#f6f8ff] p-8 text-center text-sm text-[#63708a]">등록된 공연 일정이 없어요.</p>}
      {!!slots.length && <TimetableChart slots={slots} />}
      {!!changedSlots.length && <div className="mx-4 my-6 rounded-xl bg-[#f5f7ff] p-4 text-xs leading-6 text-[#53617b]"><h2 className="font-bold text-[#152c65]">변경된 일정</h2>{changedSlots.map(slot => <p key={slot.id}><strong>{slot.title}</strong> · <del>{formatContentTime(slot.changedFromStart ?? slot.startAt)}</del> → {formatContentTime(slot.effectiveStartAt)}{slot.delayMinutes != null ? ` · ${slot.delayMinutes}분 지연` : ''}</p>)}</div>}
    </section>
  </AppLayout>
}
