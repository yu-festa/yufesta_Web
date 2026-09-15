import { useEffect, useRef, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import mainLogo from '../assets/mainlogo.png'
import timeTableDemo from '../assets/Main/TimeTableDemo.png'
import ring from '../assets/Main/Ring.png'
import map from '../assets/Main/Map.png'
import find from '../assets/Main/Find.png'
import './Main.css'

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
const cheers = ['000 화이팅~~', '학도그 맛있어용..', '르세라핌 왔다 !!']
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
  const [activePanel, setActivePanel] = useState<Panel | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (activePanel) dialogRef.current?.showModal()
  }, [activePanel])

  return (
    <AppLayout header={
      <div className="home-header">
        <img className="home-logo" src={mainLogo} width="176" height="64" alt="YU FESTA" />
        <button className="home-icon-button" aria-label="알림 확인" onClick={() => setActivePanel('notifications')}><Icon name="bell" /></button>
      </div>
    }>
      <div className="home-page">
        <h1 className="sr-only">YU FESTA 메인</h1>

        <div className="home-notice" aria-label="공연 안내 예시">
          <Icon name="speaker" />
          <p><strong>예사카락</strong>의 공연까지 <strong>5</strong>분 남았어요!</p>
        </div>

        <section className="instating-banner" aria-labelledby="instating-title">
          <img className="instating-ring" src={ring} width="100" height="80" alt="" />
          <div className="instating-tags"><span>1차 / 추첨</span><span>● 신청 현황</span></div>
          <h2 id="instating-title">INSTA - TING</h2>
          <p className="instating-description">비슷한 관심사를 가진 친구와 축제를 함께 즐겨보세요</p>
          <div className="instating-countdown" aria-label="결과 발표까지 남은 시간 예시: 1시간 24분 38초">
            <div><strong>1차 결과 발표까지</strong><span>오전 11:00 발표</span></div>
            <p><b>01</b><i>:</i><b>24</b><i>:</i><b>38</b></p>
          </div>
          <button className="instating-apply" onClick={() => setActivePanel('instating')}>신청하기 <Icon name="arrow" /></button>
        </section>

        <section className="home-timetable" aria-labelledby="timetable-title">
          <p className="home-section-description">공연 라인업과 시간을 알려드려요</p>
          <h2 id="timetable-title"><button className="home-section-link" onClick={() => setActivePanel('timetable')}><span>타임테이블 확인하기</span><Icon name="arrow" /></button></h2>
          <div className="home-performances" role="region" aria-label="공연 타임테이블 예시 목록" tabIndex={0}>
            {demoPerformances.map(performance => (
              <button className="performance-card" key={performance.id} onClick={() => setActivePanel('timetable')}>
                <img src={timeTableDemo} width="132" height="176" alt="" />
                <h3>{performance.title}</h3>
                <p>{performance.date}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="home-cheers" aria-labelledby="cheers-title">
          <p className="home-section-description">함께 만드는 축제의 순간</p>
          <h2 id="cheers-title"><button className="home-section-link" onClick={() => setActivePanel('cheers')}><span>축제를 향한 응원</span><Icon name="arrow" /></button></h2>
          <ul className="home-cheer-list" aria-label="응원 메시지 예시">
            {cheers.map(cheer => <li key={cheer}><span aria-hidden="true">✱</span>{cheer}</li>)}
          </ul>
        </section>

        <nav className="home-shortcuts" aria-label="축제 이용 안내">
          <button className="home-shortcut home-shortcut--map" onClick={() => setActivePanel('map')}>
            <Icon name="pin" />
            <div><h2>축제 지도</h2><p>공연장부터 화장실 위치까지,<br />필요한 장소를 확인해보세요</p></div>
            <img src={map} width="77" height="74" alt="" />
          </button>
          <button className="home-shortcut home-shortcut--lost" onClick={() => setActivePanel('lost')}>
            <Icon name="search" />
            <div><h2>분실물 확인</h2><p>잃어버린 물건 또는 주인 없는 물건이 있나요?<br />글을 남겨 물건을 찾아 보세요!</p></div>
            <img src={find} width="77" height="74" alt="" />
          </button>
        </nav>

        <dialog ref={dialogRef} className="home-dialog" aria-labelledby="home-dialog-title" aria-describedby="home-dialog-description" onClose={() => setActivePanel(null)} onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close() }}>
          <div className="home-dialog-content">
            <button className="home-icon-button home-dialog-close" aria-label="닫기" onClick={() => dialogRef.current?.close()}><Icon name="close" /></button>
            <h2 id="home-dialog-title">{activePanel && panels[activePanel].title}</h2>
            <p id="home-dialog-description">{activePanel && panels[activePanel].description}</p>
            {activePanel === 'timetable' && <img className="home-dialog-poster" src={timeTableDemo} alt="예시 공연 COUNTDOWN FANTASY 2025-2026 포스터" />}
          </div>
        </dialog>
      </div>
    </AppLayout>
  )
}
