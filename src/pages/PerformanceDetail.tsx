import { useCallback } from 'react'
import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import { getClub } from '../api/clubs'
import { usePublicResource } from '../hooks/usePublicResource'
import { formatContentTime } from '../utils/publicContent'
import { parseMatchTime } from '../utils/match'

type Props = { clubId: number | null; onBack: () => void; onHome: () => void }

export default function PerformanceDetail({ clubId, onBack, onHome }: Props) {
  const load = useCallback(() => clubId ? getClub(clubId) : Promise.reject(new Error('공연 정보를 찾을 수 없어요.')), [clubId])
  const resource = usePublicResource(load)
  const club = resource.data
  const performances = [...(club?.performances ?? [])].sort((a, b) => parseMatchTime(a.effectiveStartAt) - parseMatchTime(b.effectiveStartAt))
  const first = performances[0]
  const duration = first ? Math.round((parseMatchTime(first.endAt) - parseMatchTime(first.startAt)) / 60_000) : null
  const effectiveStart = first ? parseMatchTime(first.effectiveStartAt) : NaN
  const effectiveEnd = first && duration !== null && Number.isFinite(duration) && duration > 0 && Number.isFinite(effectiveStart)
    ? new Date(effectiveStart + duration * 60_000).toISOString() : first?.endAt

  return <AppLayout padded={false} header={<div className="flex h-22 items-center"><HomeLogo onHome={onHome} /></div>}>
    <div className="grid min-h-12 grid-cols-[44px_minmax(0,1fr)_44px] items-center px-2 text-[#111]">
      <button type="button" onClick={onBack} aria-label="공연 목록으로 돌아가기" className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1554ff]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
      </button>
      <p className="min-w-0 truncate text-center text-[16px] font-semibold">{club?.name ?? '공연 상세'}</p>
    </div>

    {resource.loading && !club && <p className="py-20 text-center text-sm text-[#738095]" role="status">공연 정보를 불러오고 있어요…</p>}
    {resource.error && !club && <div className="px-6 py-20 text-center text-sm text-red-700" role="alert">{resource.error}<button className="ml-3 underline" onClick={() => void resource.refresh()}>다시 불러오기</button></div>}
    {club ? <article className="@container -mb-(--app-content-padding) min-h-[calc(100dvh-136px)] bg-[#08090b] pb-[max(56px,env(safe-area-inset-bottom))] text-white" aria-labelledby="performance-title">
      <div className="relative">
        {club.photoUrl ? <img src={club.photoUrl} alt={`${club.name} 공연 사진`} width="132" height="176" fetchPriority="high" className="block aspect-3/4 h-auto w-full object-cover" />
          : <div className="grid aspect-3/4 w-full place-items-center bg-[#20232a] text-center text-sm text-[#9ba4b5]">공연 사진 준비 중</div>}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-[#08090b] to-transparent" />
      </div>

      <div className="relative px-6 @max-[350px]:px-5">
        <h1 id="performance-title" className="max-w-72 text-[clamp(26px,7cqw,34px)] leading-[1.18] font-bold tracking-[-.8px] [overflow-wrap:normal]">{club.name}</h1>
        <p className="mt-3 text-[14px] text-[#c3c5ca]">{first?.stageName ?? club.genre ?? '공연 장소 안내 예정'}</p>

        <section className="mt-12" aria-labelledby="performance-info-title">
          <h2 id="performance-info-title" className="text-[17px] font-bold">상세 정보</h2>
          <dl className="mt-5 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-3 text-[13px] leading-6">
            <dt className="text-[#8d929e]">공연시간</dt><dd>{first ? `${formatContentTime(first.effectiveStartAt)}${effectiveEnd ? ` – ${formatContentTime(effectiveEnd)}` : ''}` : '일정 안내 예정'}</dd>
            <dt className="text-[#8d929e]">장소</dt><dd>{first?.stageName ?? '장소 안내 예정'}</dd>
            <dt className="text-[#8d929e]">관람시간</dt><dd>{duration !== null && Number.isFinite(duration) && duration > 0 ? `${duration}분` : '안내 예정'}</dd>
            {club.genre && <><dt className="text-[#8d929e]">장르</dt><dd>{club.genre}</dd></>}
          </dl>
          {performances.length > 1 && <ul className="mt-4 space-y-1 text-[13px] leading-6 text-[#d7dae0]" aria-label="추가 공연 일정">{performances.slice(1).map(performance => <li key={performance.slotId}>{formatContentTime(performance.effectiveStartAt)} · {performance.stageName}</li>)}</ul>}
        </section>

        {club.intro && <section className="mt-14" aria-labelledby="performance-intro-title"><h2 id="performance-intro-title" className="text-[17px] font-bold">동아리 소개</h2><p className="mt-5 whitespace-pre-wrap text-[14px] leading-7 text-[#d7dae0]">{club.intro}</p></section>}
        {club.signatureSong && <section className="mt-14" aria-labelledby="performance-lineup-title">
          <h2 id="performance-lineup-title" className="text-[17px] font-bold">대표곡</h2>
          <div className="mt-6 flex items-start gap-3"><div aria-hidden="true" className="grid size-18 shrink-0 place-items-center rounded-full border border-white/10 bg-[#20232a] text-[#7e8798]"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l11-2v13M9 8l11-2" /><ellipse cx="6" cy="18" rx="3" ry="2" /><ellipse cx="17" cy="16" rx="3" ry="2" /></svg></div><p className="min-w-0 pt-6 text-[13px] leading-6 text-[#d7dae0]">{club.signatureSong}</p></div>
        </section>}
        {club.instagramUrl?.startsWith('https://') && <a href={club.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-12 inline-flex min-h-11 items-center rounded-xl border border-white/20 px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#fff]">인스타그램 보기 ↗</a>}
      </div>
    </article> : !resource.loading && !resource.error && <section className="px-6 py-20 text-center" aria-labelledby="performance-missing-title"><h1 id="performance-missing-title" className="text-xl font-bold">공연 정보를 찾을 수 없어요</h1><button type="button" onClick={onHome} className="mt-7 rounded-xl bg-[#1554ff] px-6 py-3 text-sm font-semibold text-white">메인으로 돌아가기</button></section>}
  </AppLayout>
}
