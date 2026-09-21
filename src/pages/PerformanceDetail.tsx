import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import type { PerformanceDetail as Performance } from '../data/performanceDetails'

type Props = { performance?: Performance; onBack: () => void; onHome: () => void }

export default function PerformanceDetail({ performance, onBack, onHome }: Props) {
  return <AppLayout padded={false} header={<div className="flex h-22 items-center"><HomeLogo onHome={onHome} /></div>}>
    <div className="grid min-h-12 grid-cols-[44px_minmax(0,1fr)_44px] items-center px-2 text-[#111]">
      <button type="button" onClick={onBack} aria-label="공연 목록으로 돌아가기" className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1554ff]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
      </button>
      <p className="min-w-0 truncate text-center text-[16px] font-semibold">{performance?.title ?? '공연 상세'}</p>
    </div>

    {performance ? <article className="@container -mb-(--app-content-padding) min-h-[calc(100dvh-136px)] bg-[#08090b] pb-[max(56px,env(safe-area-inset-bottom))] text-white" aria-labelledby="performance-title">
      <div className="relative">
        <img src={performance.poster} alt={`${performance.title} 공연 포스터`} width="132" height="176" fetchPriority="high" className="block aspect-3/4 h-auto w-full object-cover" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-[#08090b] to-transparent" />
      </div>

      <div className="relative px-6 @max-[350px]:px-5">
        <h1 id="performance-title" className="max-w-72 text-[clamp(26px,7cqw,34px)] leading-[1.18] font-bold tracking-[-.8px] [overflow-wrap:normal]">{performance.title}</h1>
        <p className="mt-3 text-[14px] text-[#c3c5ca]">{performance.venue}</p>

        <section className="mt-12" aria-labelledby="performance-info-title">
          <h2 id="performance-info-title" className="text-[17px] font-bold">상세 정보</h2>
          <dl className="mt-5 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-3 text-[13px] leading-6">
            <dt className="text-[#8d929e]">공연시간</dt><dd>{performance.date}</dd>
            <dt className="text-[#8d929e]">장소</dt><dd>{performance.venue}</dd>
            <dt className="text-[#8d929e]">관람시간</dt><dd>{performance.duration}</dd>
          </dl>
        </section>

        <section className="mt-14" aria-labelledby="performance-lineup-title">
          <h2 id="performance-lineup-title" className="text-[17px] font-bold">공연 노래 라인업</h2>
          <ul className="mt-6 grid grid-cols-5 items-start gap-3 @max-[350px]:gap-2">
            {performance.lineup.map(artist => <li key={artist} className="min-w-0 text-center">
              <div aria-hidden="true" className="mx-auto grid aspect-square w-full max-w-18 place-items-center rounded-full border border-white/10 bg-[#20232a] text-[#7e8798]">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l11-2v13M9 8l11-2" /><ellipse cx="6" cy="18" rx="3" ry="2" /><ellipse cx="17" cy="16" rx="3" ry="2" /></svg>
              </div>
              <p className="mt-3 text-[11px] leading-[1.6] break-keep text-[#d7dae0]">{artist}</p>
            </li>)}
          </ul>
        </section>
      </div>
    </article> : <section className="px-6 py-20 text-center" aria-labelledby="performance-missing-title">
      <h1 id="performance-missing-title" className="text-xl font-bold">공연 정보를 찾을 수 없어요</h1>
      <p className="mt-3 text-sm text-[#738095]">공연 목록에서 다시 선택해주세요.</p>
      <button type="button" onClick={onHome} className="mt-7 cursor-pointer rounded-xl bg-[#1554ff] px-6 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1554ff]">메인으로 돌아가기</button>
    </section>}
  </AppLayout>
}
