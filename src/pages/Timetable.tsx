import { useRef, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import mainLogo from '../assets/mainlogo.svg'
import TimetableChart from '../components/TimetableChart'
import { festivalTitle } from '../data/timetable'

const buttonClass = 'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1554ff] disabled:cursor-wait disabled:opacity-40'

export default function Timetable({ onBack }: { onBack: () => void }) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const savingRef = useRef(false)

  async function savePdf() {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setMessage('PDF를 만들고 있어요.')
    try {
      const { downloadTimetablePdf } = await import('../utils/timetablePdf')
      await downloadTimetablePdf()
      setMessage('PDF 다운로드를 시작했어요.')
    } catch {
      setMessage('PDF를 저장하지 못했어요. 저장 버튼을 다시 눌러 주세요.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <AppLayout padded={false} header={
      <div className="flex h-22 items-center">
        <img className="-ml-3 h-16 w-44 object-contain" src={mainLogo} width="176" height="64" alt="YU FESTA" />
      </div>
    }>
      <section className="pb-3 text-[#111]" aria-labelledby="timetable-heading">
        <div className="grid min-h-12 grid-cols-[44px_minmax(0,1fr)_44px] items-center px-1">
          <button className={buttonClass} onClick={onBack} aria-label="메인으로 돌아가기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
          </button>
          <h1 id="timetable-heading" className="text-center text-[clamp(16px,4.8vw,20px)] leading-snug font-medium tracking-[-0.5px]">{festivalTitle}</h1>
        </div>
        <div className="flex min-h-14 items-center justify-end px-1">
          <p role="status" className="px-2 text-right text-xs break-keep text-[#666]">{message}</p>
          <button className={buttonClass} onClick={() => void savePdf()} disabled={saving} aria-label={saving ? '타임테이블 PDF 저장 중' : '타임테이블 PDF 저장'} aria-busy={saving}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 14v6h14v-6" /></svg>
          </button>
        </div>
        <TimetableChart />
      </section>
    </AppLayout>
  )
}
