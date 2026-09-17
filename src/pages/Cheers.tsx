import { useEffect, useRef, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import { initialCheers } from '../data/cheers'

const PAGE_SIZE = 10
const iconButtonClass = 'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1554ff]'

export default function Cheers({ onBack, onHome }: { onBack: () => void; onHome: () => void }) {
  const [cheers, setCheers] = useState(initialCheers)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [message, setMessage] = useState('')
  const loadMoreRef = useRef<HTMLDivElement>(null)

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

  function submitCheer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return
    setCheers(current => [{ id: Date.now(), author: '나의 응원', message: trimmedMessage }, ...current])
    setVisibleCount(current => Math.max(current, PAGE_SIZE))
    setMessage('')
    window.scrollTo(0, 0)
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
            maxLength={100}
          />
          <button className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-[10px] bg-[#1554ff] text-white disabled:cursor-default disabled:bg-[#aac0ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1554ff]" type="submit" disabled={!message.trim()} aria-label="응원 보내기">
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
          <p className="mt-2 text-[13px] font-medium text-[#b0b0b0]">축제의 설렘과 응원을 자유롭게 남겨주세요.</p>
        </div>

        <div className="mt-9 flex items-baseline gap-2">
          <h2 className="text-[16px] font-bold">전체 응원</h2>
          <strong className="text-[16px] font-bold text-[#1554ff]">{cheers.length}</strong>
        </div>

        <ul className="mt-3" aria-label="전체 응원 목록">
          {visibleCheers.map(cheer => (
            <li className="grid min-h-18 grid-cols-[40px_minmax(0,1fr)_36px] items-center gap-2 border-b border-[#e6e6e6] py-2" key={cheer.id}>
              <span className="grid size-9 place-items-center rounded-full bg-[#dfe8ff] text-[14px] font-semibold text-[#89a5e9]" aria-hidden="true">푸</span>
              <div className="min-w-0">
                <strong className="block truncate text-[14px] font-bold tracking-[-0.25px]">{cheer.author}</strong>
                <p className="mt-1 truncate text-[11px] font-medium tracking-[-0.15px] text-[#333]">{cheer.message}</p>
              </div>
              <button className={`${iconButtonClass} size-9`} aria-label={`${cheer.author} 응원 메뉴`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
              </button>
            </li>
          ))}
        </ul>

        <div ref={loadMoreRef} className="grid min-h-12 place-items-center text-xs text-[#999]" aria-live="polite">
          {visibleCount < cheers.length ? '아래로 스크롤하면 응원을 더 불러와요' : '모든 응원을 확인했어요'}
        </div>
      </section>
    </AppLayout>
  )
}
