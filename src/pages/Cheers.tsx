import { useEffect, useRef, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import { getCheers, createCheer } from '../api/cheers'
import { createContentReport } from '../api/contentReports'
import { usePublicResource } from '../hooks/usePublicResource'
import ResourceStatus from '../components/ResourceStatus'
import { formatContentTime } from '../utils/publicContent'

const PAGE_SIZE = 10
const iconButtonClass = 'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1554ff]'

export default function Cheers({ onBack, onHome, isAuthenticated, onLogin }: { onBack: () => void; onHome: () => void; isAuthenticated: boolean; onLogin: () => void }) {
  const resource = usePublicResource(getCheers)
  const cheers = resource.data ?? []
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const lock = useRef(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [message, setMessage] = useState('')
  const [reportId, setReportId] = useState<number | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 2000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || visibleCount >= cheers.length) return

    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount(current => Math.min(current + PAGE_SIZE, cheers.length))
      }
    }, { rootMargin: '0px 0px 120px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [cheers.length, visibleCount])

  async function submitCheer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current || !message.trim()) return
    lock.current = true
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const created = await createCheer(message)
      resource.replaceData(current => [created, ...(current ?? []).filter(item => item.id !== created.id)].slice(0, 50))
      setVisibleCount(current => Math.max(current, PAGE_SIZE))
      setMessage('')
      setNotice('응원을 등록했어요.')
      window.scrollTo(0, 0)
    } catch (reason) { setError(reason instanceof Error ? reason.message : '응원을 등록하지 못했어요.') }
    finally { lock.current = false; setSaving(false) }
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (reportId === null || reporting) return
    setReporting(true); setError(''); setNotice('')
    try { await createContentReport('CHEER', reportId, reportReason); setReportId(null); setReportReason(''); setNotice('신고가 접수됐어요.') }
    catch (reason) { setError(reason instanceof Error ? reason.message : '신고를 접수하지 못했어요.') }
    finally { setReporting(false) }
  }

  const visibleCheers = cheers.slice(0, visibleCount)

  return (
    <AppLayout
      header={
        <div className="flex h-22 items-center">
          <HomeLogo onHome={onHome} />
        </div>
      }
      fixedInput={
        <form className="flex min-h-16 items-center gap-2 border-t border-[#ededed] bg-white py-2" onSubmit={submitCheer}>
          <label className="sr-only" htmlFor="cheer-message">응원 메시지</label>
          <input
            id="cheer-message"
            className="h-11 min-w-0 flex-1 rounded-[10px] border-0 bg-[#f5f5f5] px-4 text-sm text-[#222] placeholder:text-[#b9b9b9] focus:outline-2 focus:outline-[#1554ff]"
            value={message}
            onChange={event => setMessage(event.target.value)}
            placeholder="따뜻한 응원 한마디를 남겨주세요"
            maxLength={40}
            disabled={saving}
            aria-describedby="cheer-help"
          />
          <button className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-[10px] bg-[#1554ff] text-white disabled:cursor-default disabled:bg-[#aac0ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1554ff]" type="submit" disabled={saving || !message.trim()} aria-label="응원 보내기">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3.7 11.1 15.7-7.2c.7-.3 1.4.4 1.1 1.1l-7.2 15.7c-.3.7-1.3.6-1.5-.1l-1.4-5-4.9-1.4c-.8-.2-.9-1.2-.2-1.6l8.3-4.2-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </form>
      }
    >
      <section className="text-[#171717]" aria-labelledby="cheers-page-heading">
        <div className="grid min-h-12 grid-cols-[44px_minmax(0,1fr)_44px] items-center -mx-1">
          <button className={iconButtonClass} onClick={onBack} aria-label="메인으로 돌아가기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
          </button>
          <h1 id="cheers-page-heading" className="text-center text-[18px] leading-snug font-semibold tracking-[-0.4px]">축제를 향한 응원</h1>
        </div>

        <div className="mt-5">
          <p className="flex items-center gap-2 text-[13px] font-medium text-[#b5b5b5]"><span className="text-base font-bold text-[#1554ff]" aria-hidden="true">✱</span>함께 만드는 응원의 순간</p>
          <h2 className="mt-2 text-[24px] leading-tight font-bold tracking-[-0.8px]">우리의 응원이 모이는 곳</h2>
          <p className="mt-2 text-[13px] font-medium text-[#b0b0b0]">40자 이내의 응원을 남겨주세요.</p>
        </div>

        <div className="mt-9 flex items-baseline gap-2">
          <h2 className="text-[16px] font-bold">최근 응원</h2>
          <strong className="text-[16px] font-bold text-[#1554ff]">{resource.data ? cheers.length : '—'}</strong>
        </div>

        <p id="cheer-help" className="mt-2 text-xs text-[#7d89a1]">작성 중 {message.length}/40자</p>
        <ResourceStatus loading={resource.loading} error={resource.error} retry={resource.refresh} />
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mt-3 text-sm text-[#1554ff]">{notice}</p>}
        {!resource.loading && !resource.error && cheers.length === 0 && <p className="mt-8 rounded-2xl bg-[#f7f9ff] p-8 text-center text-sm">첫 응원을 남겨주세요!</p>}
        <ul className="mt-3" aria-label="최근 응원 목록">
          {visibleCheers.map(cheer => (
            <li className="grid min-h-18 grid-cols-[40px_minmax(0,1fr)] items-center gap-2 border-b border-[#e6e6e6] py-2" key={cheer.id}>
              <span className="grid size-9 place-items-center rounded-full bg-[#dfe8ff] text-[14px] font-semibold text-[#89a5e9]" aria-hidden="true">{cheer.displayName.slice(0, 1)}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <strong className="min-w-0 truncate text-[14px] font-bold tracking-[-0.25px]">{cheer.displayName}</strong>
                  {!cheer.mine && <button type="button" className="shrink-0 text-xs text-[#8a93a6] underline" onClick={() => { if (!isAuthenticated) { onLogin(); return } setReportId(reportId === cheer.id ? null : cheer.id); setReportReason('') }}>신고</button>}
                </div>
                <p className="mt-1 whitespace-pre-wrap wrap-anywhere text-[13px] font-medium tracking-[-0.15px] text-[#333]">{cheer.content}</p>
                <time className="mt-2 block text-xs text-[#8a93a6]" dateTime={cheer.createdAt}>{formatContentTime(cheer.createdAt)}</time>
                {reportId === cheer.id && <form className="mt-3 rounded-lg bg-[#f7f9ff] p-3" onSubmit={submitReport}><label className="block text-xs">신고 사유 (20자 이내)<input required maxLength={20} value={reportReason} onChange={event => setReportReason(event.target.value)} className="mt-2 min-h-10 w-full rounded-lg border px-3 text-sm" /></label><button className="mt-2 rounded-lg bg-[#1554ff] px-3 py-2 text-xs font-bold text-white disabled:opacity-50" disabled={reporting || !reportReason.trim()}>신고 접수</button></form>}
              </div>
            </li>
          ))}
        </ul>

        <div ref={loadMoreRef} className="grid min-h-12 place-items-center text-xs text-[#999]" aria-live="polite">
          {cheers.length > 0 && (visibleCount < cheers.length ? '아래로 스크롤하면 응원을 더 볼 수 있어요' : '최근 응원을 모두 확인했어요')}
        </div>
      </section>
    </AppLayout>
  )
}
