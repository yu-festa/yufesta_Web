import { useMemo, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import { useMotion } from '../hooks/useMotion'
import AppLayout from '../layout/AppLayout'
import AnnouncementCountdown from '../components/AnnouncementCountdown'
import HomeLogo from '../components/HomeLogo'
import { getCheers } from '../api/cheers'
import { getNotices } from '../api/notices'
import { getClubs } from '../api/clubs'
import { usePublicResource } from '../hooks/usePublicResource'
import ResourceStatus from '../components/ResourceStatus'
import { formatContentTime } from '../utils/publicContent'
import instatingBackground from '../assets/Main/InstatingBackground.webp'
import map from '../assets/Main/Map.svg'
import find from '../assets/Main/Find.svg'
import type { MatchSummary } from '../api/match'

const tickerFrames: Keyframe[] = [{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }]

const iconButtonClass = 'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1554ff]'
const sectionLinkClass = 'flex min-h-9 w-full items-center justify-between gap-3 text-left text-[21px] leading-snug font-bold tracking-[-0.65px] [&>svg]:size-5 [&>svg]:shrink-0'

const shortcutClass = 'grid min-h-28 w-full grid-cols-[28px_minmax(0,1fr)_86px] items-start gap-3 rounded-[10px] border px-5 py-5 text-left [&>svg]:mt-0.5 [&>svg]:size-6 [&>svg]:text-[#1554ff] [&>img]:-my-1.5 [&>img]:h-20 [&>img]:w-[86px] [&>img]:self-center [&>img]:object-contain @max-[320px]:grid-cols-[24px_minmax(0,1fr)_62px] @max-[320px]:gap-2 @max-[320px]:px-3.5 @max-[320px]:[&>img]:w-[62px]'

const iconPaths = {
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9Z" /><path d="M10 21h4" /></>,
  arrow: <path d="m9 4 7 8-7 8" />,
  speaker: <><path d="m14 4-8 5H3v6h3l8 5V4ZM6 15l2 5h3l-2-3M17 8v8M20 6v12" /></>,
  pin: <><path d="M12 22s8-7.5 8-14a8 8 0 1 0-16 0c0 6.5 8 14 8 14Z" fill="currentColor" stroke="none" /><circle cx="12" cy="8" r="3" fill="white" stroke="none" /></>,
  search: <><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 6 6" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
}

function Icon({ name, className = '' }: { name: keyof typeof iconPaths; className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>
}


export default function Main({ onHome, onOpenNotices, onOpenNotice, onOpenTimetable, onOpenPerformance, onOpenCheers, onOpenMap, onOpenLost, onApplyInstating, onOpenProfile, alreadyApplied = false, canApply = false, matchSummary, receivedAt }: { onHome: () => void; onOpenNotices: () => void; onOpenNotice: (id: number) => void; onOpenTimetable: () => void; onOpenPerformance: (id: string) => void; onOpenCheers: () => void; onOpenMap: () => void; onOpenLost: () => void; onApplyInstating: () => void; onOpenProfile: () => void; alreadyApplied?: boolean; canApply?: boolean; matchSummary?: MatchSummary | null; receivedAt?: number }) {
  const cheersResource = usePublicResource(getCheers)
  const noticesResource = usePublicResource(getNotices)
  const clubsResource = usePublicResource(getClubs)
  const cheers = cheersResource.data?.slice(0, 9) ?? []
  const banner = noticesResource.data?.find(notice => notice.banner)
  const [cheersPaused, setCheersPaused] = useState(false)
  const [cheersHovered, setCheersHovered] = useState(false)
  const [cheersFocused, setCheersFocused] = useState(false)
  const lineupDrag = useRef<{ pointerId: number; startX: number; scrollLeft: number; dragging: boolean } | null>(null)
  const ignoreLineupClick = useRef(false)
  const startLineupDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    lineupDrag.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: event.currentTarget.scrollLeft, dragging: false }
  }
  const moveLineupDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = lineupDrag.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const distance = event.clientX - drag.startX
    if (!drag.dragging && Math.abs(distance) > 5) {
      drag.dragging = true
      event.currentTarget.setPointerCapture(event.pointerId)
      event.currentTarget.style.scrollSnapType = 'none'
    }
    if (drag.dragging) {
      event.preventDefault()
      event.currentTarget.scrollLeft = drag.scrollLeft - distance
    }
  }
  const endLineupDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = lineupDrag.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (drag.dragging) {
      ignoreLineupClick.current = true
      event.currentTarget.style.scrollSnapType = ''
      window.setTimeout(() => { ignoreLineupClick.current = false }, 0)
    }
    lineupDrag.current = null
  }
  const handleLineupClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!ignoreLineupClick.current) return
    event.preventDefault()
    event.stopPropagation()
    ignoreLineupClick.current = false
  }
  const tickerTiming = useMemo<KeyframeAnimationOptions>(() => ({ duration: Math.min(32000, Math.max(8000, cheers.length * 4000)), iterations: Infinity, easing: 'linear' }), [cheers.length])
  const tickerRef = useMotion<HTMLDivElement>(tickerFrames, tickerTiming, cheers.length, cheersPaused || cheersHovered || cheersFocused)
  return (
    <AppLayout header={
      <div className="flex h-22 items-center justify-between">
        <HomeLogo onHome={onHome} />
        <div className="flex items-center">
          <button type="button" className={iconButtonClass} aria-label="내 프로필" onClick={onOpenProfile}><Icon name="profile" /></button>
          <button className={iconButtonClass} aria-label="공지 확인" onClick={onOpenNotices}><Icon name="bell" /></button>
        </div>
      </div>
    }>
      <div className="@container pb-5 text-[#111] [&_button]:cursor-pointer [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#1554ff]">
        <span role="heading" aria-level={1} className="sr-only font-bold">YU FESTA 메인</span>

<button type="button" className="flex min-h-10 w-full items-center gap-3 rounded-[10px] bg-[#f5f5f5] px-3.5 py-3 text-left text-sm" onClick={() => banner ? onOpenNotice(banner.id) : onOpenNotices}>
          <Icon name="speaker" className="shrink-0 text-[#63708a]" /><span className="font-semibold text-[#1353f2] wrap-anywhere">{banner?.title ?? '축제 공지 확인하기'}</span>
        </button>
        <ResourceStatus loading={noticesResource.loading} error={noticesResource.error} retry={noticesResource.refresh} />

        <section data-testid="instating-banner" data-theme="blue" className={"relative isolate overflow-hidden mt-[16px] [padding:clamp(18px,_6.4cqw,_28px)] rounded-[18px] bg-[#12112f] text-[#fff] [&_.instating-banner-action:disabled]:text-[#dceaff] [&_.instating-banner-action:disabled]:bg-[#12335e]/60 [&_.instating-banner-action:disabled]:cursor-default [&[data-theme='blue']]:bg-[#071a49] [&[data-theme='blue']_.instating-banner-art]:[filter:hue-rotate(-48deg)_saturate(115%)] [&[data-theme='blue']_.instating-banner-shade]:[background:linear-gradient(100deg,#031b4d99,#064ea83d_55%,#2488ff38)] instating-banner"} aria-labelledby="instating-title">
          <img className={"absolute inset-[0] z-[-1] w-full h-full pointer-events-none object-cover [object-position:65%_center] instating-banner-art"} src={instatingBackground} width="1536" height="1024" alt="" draggable={false} />
          <div className={"absolute inset-[0] z-[-1] w-full h-full pointer-events-none [background:linear-gradient(90deg,_#100c2c33,_transparent_75%)] instating-banner-shade"} aria-hidden="true" />
          <div className={"flex items-center gap-[6px] [&_>_span]:inline-flex [&_>_span]:items-center [&_>_span]:gap-[5px] [&_>_span]:[padding:4px_9px] [&_>_span]:[border:1px_solid_#afcce65c] [&_>_span]:rounded-[30px] [&_>_span]:bg-[#163049bd] [&_>_span]:text-[clamp(9px,_2.5cqw,_11px)] [&_>_span]:leading-[1.3] [&_>_span]:font-[650] [&_>_span]:text-[#e5f0fc] [&_>_span]:[box-shadow:inset_0_1px_1px_#ffffff2b] [&_i]:w-[5px] [&_i]:h-[5px] [&_i]:rounded-full [&_i]:bg-[#a8dcff] instating-banner-badges"}><span>{matchSummary ? `${matchSummary.currentRound.seq}차 / ${matchSummary.currentRound.status === 'OPEN' ? '접수 중' : matchSummary.currentRound.status === 'SCHEDULED' ? '접수 예정' : matchSummary.currentRound.status === 'CLOSED' ? '마감' : '발표'}` : '1차 / 추첨'}</span><span><i aria-hidden="true" />{matchSummary ? `신청 ${matchSummary.applicantCount.toLocaleString()}명` : '신청 현황'}</span></div>
          <h2 id="instating-title" className={"mt-[11px] [font-family:'Rubik_One',_sans-serif] text-[clamp(22px,_8.1cqw,_38px)] font-normal leading-[1.15] tracking-[-.6px] whitespace-nowrap [text-shadow:0_2px_12px_#100b3544] instating-banner-title"}>INSTA - TING</h2>
          <p className={"mt-[14px] text-[clamp(11px,_2.8cqw,_13px)] leading-[1.55] font-medium instating-banner-description"}>비슷한 관심사를 가진 친구와<br />축제를 함께 즐겨보세요</p>
          <AnnouncementCountdown key={matchSummary?.serverNow ?? 'fallback'} publishAt={matchSummary?.currentRound.publishAt} serverNow={matchSummary?.serverNow} receivedAt={receivedAt} roundSeq={matchSummary?.currentRound.seq} />
          <div className={"flex gap-[12px] mt-[24px] [@container(max-width:_320px)]:gap-[8px] instating-banner-actions"}>
            <button type="button" className={"inline-flex justify-between items-center gap-[10px] min-h-[44px] [padding:10px_14px] rounded-[11px] bg-[#123d78]/65 text-[#f0f7ff] border border-[#c9e7ff]/50 backdrop-blur-xl shadow-[inset_0_1px_0_#ffffff33,0_4px_16px_#02133033] text-[clamp(11px,_2.8cqw,_13px)] font-[650] whitespace-nowrap [transition:background_.15s,_transform_.15s] [&_svg]:w-[15px] [&_svg]:h-[15px] [&_svg]:shrink-0 [&_svg]:[stroke-width:3] [&:hover:not(:disabled)]:bg-[#2460a0]/80 [&:active:not(:disabled)]:[transform:translateY(1px)] [@container(max-width:_320px)]:px-[11px] [@container(max-width:_320px)]:gap-[8px] [@media(prefers-reduced-motion:_reduce)]:[transition:none] instating-banner-action"} onClick={onApplyInstating} disabled={alreadyApplied || !canApply}>{alreadyApplied ? '신청 완료' : canApply ? '신청하기' : '접수 대기'}<Icon name="arrow" /></button>
            <button type="button" className={"inline-flex justify-between items-center gap-[10px] min-h-[44px] [padding:10px_14px] rounded-[11px] bg-[#123d78]/65 text-[#f0f7ff] border border-[#c9e7ff]/50 backdrop-blur-xl shadow-[inset_0_1px_0_#ffffff33,0_4px_16px_#02133033] text-[clamp(11px,_2.8cqw,_13px)] font-[650] whitespace-nowrap [transition:background_.15s,_transform_.15s] [&_svg]:w-[15px] [&_svg]:h-[15px] [&_svg]:shrink-0 [&_svg]:[stroke-width:3] [&:hover:not(:disabled)]:bg-[#2460a0]/80 [&:active:not(:disabled)]:[transform:translateY(1px)] [@container(max-width:_320px)]:px-[11px] [@container(max-width:_320px)]:gap-[8px] [@media(prefers-reduced-motion:_reduce)]:[transition:none] instating-banner-action"} onClick={onOpenProfile}>신청내역 보러가기<Icon name="arrow" /></button>
          </div>
        </section>

        <section className="mt-7" aria-labelledby="timetable-title">
          <span className="block font-medium text-[#777] text-[13px]">공연 라인업과 시간을 알려드려요</span>
          <span role="heading" aria-level={2} id="timetable-title" className="block font-bold"><button className={sectionLinkClass} onClick={onOpenTimetable}><span className="font-bold text-[20px]">타임테이블 확인하기</span><Icon name="arrow" /></button></span>
          <ResourceStatus loading={clubsResource.loading} error={clubsResource.error} retry={clubsResource.refresh} />
          {!clubsResource.loading && !clubsResource.error && !clubsResource.data?.length && <p className="mt-3 rounded-xl bg-[#f6f8ff] p-4 text-sm text-[#63708a]">등록된 동아리 공연이 없어요. 타임테이블에서 전체 일정을 확인해 주세요.</p>}
          <div onPointerDown={startLineupDrag} onPointerMove={moveLineupDrag} onPointerUp={endLineupDrag} onPointerCancel={endLineupDrag} onClickCapture={handleLineupClick} onDragStart={event => event.preventDefault()} className="mt-4 flex w-[calc(100%+var(--app-content-padding))] snap-x snap-proximity select-none cursor-grab items-start gap-8 overflow-x-auto overscroll-x-contain pr-(--app-content-padding) pb-1 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1554ff] [&::-webkit-scrollbar]:hidden @max-[320px]:gap-6" role="region" aria-label="공연 동아리 목록" tabIndex={0}>
            {(clubsResource.data ?? []).map(club => (
              <button type="button" className="min-w-0 flex-[0_0_clamp(144px,40cqw,176px)] snap-start text-left" key={club.id} onClick={() => onOpenPerformance(String(club.id))}>
                {club.photoUrl ? <img src={club.photoUrl} width="132" height="176" alt="" loading="lazy" draggable={false} className="block aspect-3/4 w-full rounded-xl object-cover" /> : <span className="grid aspect-3/4 w-full place-items-center rounded-xl bg-linear-to-br from-[#123585] to-[#6e95fb] px-3 text-center text-xl font-bold text-white">{club.name}</span>}
                <span role="heading" aria-level={3} className="mt-2 block text-[14px] leading-snug font-semibold tracking-[-0.35px]">{club.name}</span>
                <span className="mt-1 block text-[12px] text-[#858585]">{club.performances[0] ? formatContentTime(club.performances[0].effectiveStartAt) : club.genre ?? '공연 예정'}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="cheers-title">
          <span className="block font-medium text-[#777] text-[13px]">함께 만드는 축제의 순간</span>
          <span role="heading" aria-level={2} id="cheers-title" className=" font-bold"><button className={sectionLinkClass} onClick={onOpenCheers}><span className="font-bold text-[20px]">축제를 향한 응원</span><Icon name="arrow" /></button></span>
          <ResourceStatus loading={cheersResource.loading} error={cheersResource.error} retry={cheersResource.refresh} />
          {!cheersResource.loading && !cheersResource.error && !cheers.length && <p className="mt-3 rounded-xl bg-[#f6f6f6] p-4 text-sm text-[#63708a]">아직 응원이 없어요. 첫 응원을 남겨주세요!</p>}
          {cheers.length > 0 && <div className={"flex items-center mt-[10px] rounded-[10px] bg-[#f6f6f6] overflow-hidden cheers-ticker"} data-paused={cheersPaused} onMouseEnter={() => setCheersHovered(true)} onMouseLeave={() => setCheersHovered(false)}>
            <div className={"flex-1 min-w-[0] overflow-hidden py-[11px] pl-3 [&:focus-visible]:[outline:2px_solid_#1554ff] [&:focus-visible]:outline-offset-[-3px] [@media(prefers-reduced-motion:reduce)]:overflow-x-auto cheers-ticker-window"} onFocus={() => setCheersFocused(true)} onBlur={() => setCheersFocused(false)} tabIndex={0} role="region" aria-label="응원 메시지. 자동으로 왼쪽으로 이동합니다.">
              <div ref={tickerRef} className={"flex w-max cheers-ticker-track"}>
                <ul className={"flex flex-none items-center gap-[24px] pr-[24px] [&_li]:flex [&_li]:flex-none [&_li]:items-center [&_li]:gap-[10px] [&_li]:text-[14px] [&_li]:font-medium [&_li]:whitespace-nowrap [&_li]:leading-[22px] [&_li_>_span]:text-[#1554ff] [&_li_>_span]:text-[18px] [&_li_>_span]:font-bold cheers-ticker-list"} aria-label="최근 응원 메시지">
                  {cheers.map(cheer => <li key={cheer.id}><span aria-hidden="true">✱</span>{cheer.content}</li>)}
                </ul>
              </div>
            </div>
            <button type="button" className={"grid place-items-center w-[40px] min-h-[44px] shrink-0 text-[#7c8799] bg-[#f6f6f6] cursor-pointer text-[12px] [&:focus-visible]:[outline:2px_solid_#1554ff] [&:focus-visible]:outline-offset-[-3px] [@media(prefers-reduced-motion:reduce)]:hidden cheers-ticker-toggle"} onClick={() => setCheersPaused(paused => !paused)} aria-label={cheersPaused ? '응원글 자동 이동 재생' : '응원글 자동 이동 일시정지'} aria-pressed={cheersPaused}><span aria-hidden="true">{cheersPaused ? '▶' : 'Ⅱ'}</span></button>
          </div>}
        </section>

        <nav className="mt-12 grid gap-6" aria-label="축제 이용 안내">
          <button className={`${shortcutClass} border-transparent bg-[#f0f4ff]`} onClick={onOpenMap}>
            <Icon name="pin" />
            <div className="flex flex-col gap-2"><span className="font-bold text-xl">축제 지도</span><span className="text-[13px] text-[#B4B4B4]">공연장부터 화장실 위치까지,<br />필요한 장소를 확인해보세요</span></div>
            <img src={map} width="90" height="4" alt="" />
          </button>
          <button className={`${shortcutClass} border-[#d5e0ff] bg-white`} onClick={onOpenLost}>
            <Icon name="search" />
            <div className="flex flex-col gap-2"><span className="font-bold text-xl">분실물 확인</span><span className="text-[12px] text-[#B4B4B4]">잃어버린 물건 또는 주인 없는 물건이 있나요?<br />글을 남겨 물건을 찾아 보세요!</span></div>
            <img src={find} width="77" height="74" alt="" />
          </button>
        </nav>


      </div>
    </AppLayout>
  )
}
