import { useEffect, useRef, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import AnnouncementCountdown from '../components/AnnouncementCountdown'
import mainLogo from '../assets/mainlogo.svg'
import timeTableDemo from '../assets/Main/TimeTableDemo.svg'
import ring from '../assets/Main/Ring.svg'
import map from '../assets/Main/Map.svg'
import find from '../assets/Main/Find.svg'
import { useMotion } from '../hooks/useMotion'

const ringFrames = [{ transform: 'translateY(0) rotate(-2deg)' }, { transform: 'translateY(-4px) rotate(2deg)' }, { transform: 'translateY(0) rotate(-2deg)' }]
const ringTiming = { duration: 5000, iterations: Infinity, easing: 'ease-in-out' }
const iconButtonClass = 'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1554ff]'
const sectionLinkClass = 'flex min-h-9 w-full items-center justify-between gap-3 text-left text-[21px] leading-snug font-bold tracking-[-0.65px] [&>svg]:size-5 [&>svg]:shrink-0'

const shortcutClass = 'grid min-h-28 w-full grid-cols-[28px_minmax(0,1fr)_86px] items-start gap-3 rounded-[10px] border px-5 py-5 text-left [&>svg]:mt-0.5 [&>svg]:size-6 [&>svg]:text-[#1554ff] [&_h2]:text-[21px] [&_h2]:leading-snug [&_h2]:font-bold [&_h2]:tracking-[-0.6px] [&_p]:mt-3 [&_p]:text-[11px] [&_p]:leading-relaxed [&_p]:break-keep [&_p]:text-[#858585] [&>img]:-my-1.5 [&>img]:h-20 [&>img]:w-[86px] [&>img]:self-center [&>img]:object-contain @max-[320px]:grid-cols-[24px_minmax(0,1fr)_62px] @max-[320px]:gap-2 @max-[320px]:px-3.5 @max-[320px]:[&>img]:w-[62px]'

const iconPaths = {
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

// 백엔드와 상세 페이지 연결 전 사용하는 화면 예시입니다.
const demoPerformances = Array.from({ length: 3 }, (_, index) => ({
  id: `demo-${index}`, title: 'COUNTDOWN FANTASY 2025-2026', date: '2025.12.20 - 2025.12.21',
}))
const cheers = ['000 화이팅~~', '핫도그 맛있어용..', '르세라핌 왔다 !!']
const panels = {
  notifications: { title: '알림', description: '새로운 알림이 없어요.' },
  instating: { title: 'INSTA - TING', description: '인스타팅 신청은 준비 중이에요. 신청 일정이 열리면 안내해 드릴게요.' },
  timetable: { title: '타임테이블', description: '지금은 예시 공연을 보여드리고 있어요. 축제 라인업과 공연 시간은 추후 공개돼요.' },
  cheers: { title: '축제를 향한 응원', description: '응원 메시지 작성은 준비 중이에요. 지금 보이는 메시지는 화면 예시예요.' },
  map: { title: '축제 지도', description: '공연장과 부스 위치를 확인할 수 있는 지도를 준비 중이에요.' },
  lost: { title: '분실물 확인', description: '분실물 조회와 등록 기능을 준비 중이에요.' },
}
type Panel = keyof typeof panels

export default function Main() {
  const ringRef = useMotion<HTMLImageElement>(ringFrames, ringTiming)
  const [activePanel, setActivePanel] = useState<Panel | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (activePanel) dialogRef.current?.showModal()
  }, [activePanel])

  return (
    <AppLayout header={
      <div className="flex h-22 items-center justify-between">
        <img className="-ml-3 h-16 w-44 object-contain" src={mainLogo} width="176" height="64" alt="YU FESTA" />
        <button className={iconButtonClass} aria-label="알림 확인" onClick={() => setActivePanel('notifications')}><Icon name="bell" /></button>
      </div>
    }>
      <div className="@container pb-5 text-[#111] [&_button]:cursor-pointer [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#1554ff]">
        <h1 className="sr-only">YU FESTA 메인</h1>

        <div className="flex min-h-10 items-center gap-3 rounded-[10px] bg-[#f5f5f5] px-3.5 py-2.5 [&>svg]:size-[19px] [&>svg]:shrink-0 [&>svg]:text-[#63708a] [&>p]:text-[13px] [&>p]:leading-normal [&_strong]:mr-1 [&_strong]:font-bold [&_strong]:text-[#1554ff]" aria-label="공연 안내 예시">
          <Icon name="speaker" />
          <p><strong>예사카락</strong>의 공연까지 <strong>5</strong>분 남았어요!</p>
        </div>

        <section data-testid="instating-banner" className="relative isolate mt-4 min-h-42 overflow-hidden rounded-lg border border-white/40 bg-[linear-gradient(180deg,#779DF9_0%,#1353F2_100%)] px-6 pt-4 pb-4 font-[Arial,sans-serif] text-white shadow-[inset_0_1px_1px_#ffffffa6,inset_0_-3px_6px_#0b36b044,0_8px_20px_-10px_#1353f27a] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[linear-gradient(125deg,#ffffff42_0%,#ffffff09_32%,transparent_33%,#ffffff10_53%,transparent_54%)] after:pointer-events-none after:absolute after:-top-[55px] after:-right-[35px] after:-z-10 after:size-45 after:rounded-full after:border after:border-white/15 after:bg-[radial-gradient(circle_at_35%_35%,#d7f6ff66,#b2d9ff15_52%,transparent_70%)] @max-[320px]:px-4" aria-labelledby="instating-title">
          <img ref={ringRef} data-testid="banner-ring" className="absolute top-4 right-[13px] -z-10 h-auto w-[27%] object-contain [filter:drop-shadow(0_10px_7px_#08267d55)_drop-shadow(0_-2px_5px_#e3ffff55)]" src={ring} width="100" height="80" alt="" />
          <div className="flex gap-1.5 text-[10px] leading-normal [&>span]:rounded-full [&>span]:border [&>span]:border-white/25 [&>span]:bg-white/15 [&>span]:px-2 [&>span]:py-0.5 [&>span]:shadow-[inset_0_1px_0_#ffffff45] [&>span]:backdrop-blur-sm"><span>1차 / 추첨</span><span>● 신청 현황</span></div>
          <h2 id="instating-title" className="relative mt-1 w-max max-w-full font-['Rubik_One',sans-serif] text-[clamp(20px,8cqw,32px)] leading-[1.3] font-normal tracking-[-0.4px] whitespace-nowrap">INSTA - TING</h2>
          <p className="relative mt-1.5 max-w-[76%] text-[11px] leading-relaxed text-[#f1f6ff]">비슷한 관심사를 가진 친구와 축제를 함께 즐겨보세요</p>
          <AnnouncementCountdown />
          <button className="mt-3 flex min-h-8 items-center gap-1.5 rounded-full border border-white/70 bg-linear-to-b from-white to-[#e8f1ff] px-4 py-1.5 text-xs font-bold text-[#1554ff] shadow-[inset_0_1px_0_#fff,0_3px_7px_#123dab33] [&>svg]:size-3.5 [&>svg]:stroke-[2.5]" onClick={() => setActivePanel('instating')}>신청하기 <Icon name="arrow" /></button>
        </section>

        <section className="mt-7" aria-labelledby="timetable-title">
          <p className="text-sm leading-relaxed text-[#777]">공연 라인업과 시간을 알려드려요</p>
          <h2 id="timetable-title"><button className={sectionLinkClass} onClick={() => setActivePanel('timetable')}><span>타임테이블 확인하기</span><Icon name="arrow" /></button></h2>
          <div className="mt-4 flex w-[calc(100%+var(--app-content-padding))] snap-x snap-proximity items-start gap-8 overflow-x-auto overscroll-x-contain pr-(--app-content-padding) pb-1 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1554ff] [&::-webkit-scrollbar]:hidden @max-[320px]:gap-6" role="region" aria-label="공연 타임테이블 예시 목록" tabIndex={0}>
            {demoPerformances.map(performance => (
              <button className="min-w-0 flex-[0_0_clamp(144px,40cqw,176px)] snap-start text-left [&>img]:block [&>img]:aspect-3/4 [&>img]:h-auto [&>img]:w-full [&>img]:object-cover [&>h3]:mt-2 [&>h3]:text-[15px] [&>h3]:leading-snug [&>h3]:font-normal [&>h3]:tracking-[-0.35px] [&>h3]:[overflow-wrap:normal] [&>p]:mt-3.5 [&>p]:text-[13px] [&>p]:leading-normal [&>p]:whitespace-nowrap [&>p]:text-[#858585]" key={performance.id} onClick={() => setActivePanel('timetable')}>
                <img src={timeTableDemo} width="132" height="176" alt="" />
                <h3>{performance.title}</h3>
                <p>{performance.date}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="cheers-title">
          <p className="text-sm leading-relaxed text-[#777]">함께 만드는 축제의 순간</p>
          <h2 id="cheers-title"><button className={sectionLinkClass} onClick={() => setActivePanel('cheers')}><span>축제를 향한 응원</span><Icon name="arrow" /></button></h2>
          <ul className="mt-2.5 flex min-h-11 items-center gap-5 overflow-x-auto rounded-[10px] bg-[#f6f6f6] px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>li]:flex [&>li]:shrink-0 [&>li]:items-center [&>li]:gap-2.5 [&>li]:text-sm [&>li]:leading-normal [&>li]:whitespace-nowrap [&_span]:text-base [&_span]:font-bold [&_span]:text-[#1554ff]" aria-label="응원 메시지 예시">
            {cheers.map(cheer => <li key={cheer}><span aria-hidden="true">✱</span>{cheer}</li>)}
          </ul>
        </section>

        <nav className="mt-12 grid gap-6" aria-label="축제 이용 안내">
          <button className={`${shortcutClass} border-transparent bg-[#f0f4ff]`} onClick={() => setActivePanel('map')}>
            <Icon name="pin" />
            <div><span className="font-bold text-xl">축제 지도</span><p>공연장부터 화장실 위치까지,<br />필요한 장소를 확인해보세요</p></div>
            <img src={map} width="77" height="74" alt="" />
          </button>
          <button className={`${shortcutClass} border-[#d5e0ff] bg-white`} onClick={() => setActivePanel('lost')}>
            <Icon name="search" />
            <div><h2>분실물 확인</h2><p>잃어버린 물건 또는 주인 없는 물건이 있나요?<br />글을 남겨 물건을 찾아 보세요!</p></div>
            <img src={find} width="77" height="74" alt="" />
          </button>
        </nav>

        <dialog ref={dialogRef} className="fixed inset-0 m-auto max-h-[calc(100dvh-48px)] w-[min(440px,calc(100%-40px))] rounded-[20px] border-0 bg-white p-0 text-[#17233f] shadow-[0_20px_80px_#14234433] backdrop:bg-[#11182766]" aria-labelledby="home-dialog-title" aria-describedby="home-dialog-description" onClose={() => setActivePanel(null)} onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close() }}>
          <div className="relative px-6 py-8 [&>h2]:pr-7 [&>h2]:text-2xl [&>h2]:font-bold [&>p]:mt-4 [&>p]:text-base [&>p]:leading-relaxed [&>p]:break-keep [&>p]:text-slate-500">
            <button className={`${iconButtonClass} absolute top-2 right-2`} aria-label="닫기" onClick={() => dialogRef.current?.close()}><Icon name="close" /></button>
            <h2 id="home-dialog-title">{activePanel && panels[activePanel].title}</h2>
            <p id="home-dialog-description">{activePanel && panels[activePanel].description}</p>
            {activePanel === 'timetable' && <img className="mx-auto mt-6 block w-45 max-w-full" src={timeTableDemo} alt="예시 공연 COUNTDOWN FANTASY 2025-2026 포스터" />}
          </div>
        </dialog>
      </div>
    </AppLayout>
  )
}
