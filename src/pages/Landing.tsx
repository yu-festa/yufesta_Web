import { useEffect, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import { getFestivalCountdown } from '../utils/festivalLaunch'
import mainLogo from '../assets/mainlogo.svg'
import arrowDown from '../assets/Landing/arrow-down.svg'
import arrowForward from '../assets/Landing/arrow-forward.svg'
import menuIcon from '../assets/Landing/menu.svg'
import mapArtwork from '../assets/Landing/map.png'
import cheersArtwork from '../assets/Landing/cheers.png'
import instatingArtwork from '../assets/Main/InstatingBackground.webp'
import lostArtwork from '../assets/Main/Find.svg'
import './Landing.css'

const faqs = [
  { question: '축제 서비스는 언제 열리나요?', answer: '2026년 10월 1일 0시, 축제 시작과 함께 열려요. 이 화면의 카운트다운이 끝나면 메인 화면으로 자동으로 이동해요.' },
  { question: 'YU FESTA에서는 무엇을 할 수 있나요?', answer: '공연 타임테이블과 축제 지도를 확인하고, 인스타팅으로 함께할 친구를 만나보세요. 응원을 남기거나 분실물을 찾는 것도 도와드려요.' },
  { question: '타임테이블을 따로 저장할 수 있나요?', answer: '메인 화면에서 타임테이블을 열고 저장 버튼을 누르면 이미지로 저장할 수 있어요. 축제를 즐기면서 편하게 꺼내보세요.' },
]

function LandingCountdown({ target }: { target: number }) {
  const [remaining, setRemaining] = useState(() => getFestivalCountdown(Date.now(), target))
  useEffect(() => {
    const update = () => setRemaining(getFestivalCountdown(Date.now(), target))
    const timer = setInterval(update, 1000)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => { clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update) }
  }, [target])
  const units = [{ value: remaining.days, label: '일' }, { value: remaining.hours, label: '시간' }, { value: remaining.minutes, label: '분' }, { value: remaining.seconds, label: '초' }]
  return <div className="landing-countdown" role="timer" aria-live="off" aria-label={`축제까지 ${units.map(unit => `${unit.value}${unit.label}`).join(' ')}`}>
    {units.map(unit => <div className="landing-countdown-row" key={unit.label} aria-hidden="true"><span>{String(unit.value).padStart(2, '0')}</span><span>{unit.label}</span></div>)}
  </div>
}

export default function Landing({ target }: { target: number }) {
  const [menuOpen, setMenuOpen] = useState(false)
  function goTo(id: string) {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  return <AppLayout padded={false}>
    <div className="festival-landing">
      <section className="landing-hero" id="landing-top" aria-labelledby="landing-title">
        <header className="landing-header">
          <button type="button" className="landing-logo" onClick={() => goTo('landing-top')} aria-label="YU FESTA 랜딩 처음으로"><img src={mainLogo} alt="YU FESTA" width="176" height="64" /></button>
          <span className="landing-header-edition">AUTUMN 2026</span>
          <button type="button" className="landing-menu-toggle" aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen(value => !value)}>{menuOpen ? '닫기' : <img src={menuIcon} width="24" height="24" alt="" />}</button>
          {menuOpen && <nav id="landing-navigation" className="landing-navigation" aria-label="랜딩 페이지 메뉴" onKeyDown={event => { if (event.key === 'Escape') setMenuOpen(false) }}>
            <button type="button" onClick={() => goTo('landing-countdown')}>축제까지 남은 시간</button>
            <button type="button" onClick={() => goTo('landing-services')}>서비스 소개</button>
            <button type="button" onClick={() => goTo('landing-faq')}>자주 묻는 질문</button>
          </nav>}
        </header>
        <div className="landing-hero-content"><p className="landing-hero-kicker">YEUNGNAM UNIVERSITY · FALL FESTIVAL</p><h1 id="landing-title">THE<br />AUTUMN<br />MOMENT<br /><span>2026</span></h1><div className="landing-hero-description"><strong>우리의 가을, 가장 빛나는 순간</strong><p>2026 영남대학교 가을축제<br />YU FESTA와 함께하세요.</p></div></div>
        <button type="button" className="landing-scroll" onClick={() => goTo('landing-countdown')} aria-label="축제 카운트다운 보기"><img src={arrowDown} width="24" height="24" alt="" /></button>
      </section>

      <section id="landing-countdown" className="landing-section landing-countdown-section" aria-labelledby="landing-countdown-title">
        <p className="landing-eyebrow">Count Down</p><h2 id="landing-countdown-title">축제까지 남은 시간</h2>
        <LandingCountdown target={target} />
        <div className="landing-opening"><time dateTime="2026-10-01T00:00:00+09:00">2026. 10. 01 THU · 00:00 KST</time><p>설렘이 시작되는 순간,<br />축제 메인 화면이 자동으로 열려요.</p></div>
      </section>

      <section id="landing-services" className="landing-section landing-services" aria-labelledby="landing-services-title">
        <div className="landing-section-heading"><p className="landing-eyebrow">Festival Start</p><h2 id="landing-services-title">축제의 모든 순간을<br />YU FESTA와 함께</h2><p>기다리던 무대부터 새로운 만남까지.<br />우리의 축제를 더 편하게, 더 즐겁게.</p></div>
        <div className="landing-service-list">
          <article className="landing-service-card landing-card-timetable">
            <p className="landing-card-category">Time Table</p><h3>놓치고 싶지 않은 무대,<br />한눈에 확인하세요</h3>
            <div className="landing-timetable-art" aria-hidden="true"><span className="landing-ticket-label">YOUR FESTIVAL PLAYLIST</span><strong>MAKE<br />SOME<br /><span>NOISE!</span></strong><div className="landing-ticket-lines"><span>STAGE 01</span><span>STAGE 02</span><i /><i /><i /><i /></div><span className="landing-ticket-bottom">2026.10.01 · YU FESTA</span></div>
            <details><summary><span>공연 타임테이블</span><span className="landing-card-arrow"><img src={arrowForward} width="24" height="24" alt="" /></span></summary><p>무대별 공연 시간과 순서를 한눈에 확인하세요. 타임테이블을 이미지로 저장해두면 다시 찾아보기 편해요.</p></details>
          </article>
          <article className="landing-service-card landing-card-map">
            <p className="landing-card-category">Festival Map</p><h3>어디로 가야 할지 고민될 때,<br />축제 지도를 펼쳐보세요</h3><img className="landing-service-art landing-map-art" src={mapArtwork} width="562" height="648" alt="풍선과 함께 꾸며진 축제 부스" loading="lazy" />
            <details><summary><span>축제 지도</span><span className="landing-card-arrow"><img src={arrowForward} width="24" height="24" alt="" /></span></summary><p>공연장, 화장실 등 필요한 장소를 지도에서 찾아보세요. 현재 위치와 카테고리별 필터로 축제 동선을 편하게 확인할 수 있어요.</p></details>
          </article>
          <article className="landing-service-card landing-card-instating">
            <p className="landing-card-category">Insta-ting</p><h3>취향이 비슷한 친구와<br />함께 즐기는 가을축제</h3><div className="landing-instating-art"><img src={instatingArtwork} alt="별빛 속 반짝이는 크리스털 하트" width="1536" height="1024" loading="lazy" /><span>INSTA<br />TING!</span></div>
            <details><summary><span>두근두근 인스타팅</span><span className="landing-card-arrow"><img src={arrowForward} width="24" height="24" alt="" /></span></summary><p>나를 소개하고 관심 있는 취향을 골라보세요. 축제를 함께 즐길 새로운 친구와의 설레는 만남을 준비하고 있어요.</p></details>
          </article>
          <article className="landing-service-card landing-card-cheers">
            <p className="landing-card-category">Cheer Together</p><h3>축제를 향한 응원 한마디,<br />함께 남겨볼까요?</h3><img className="landing-service-art" src={cheersArtwork} width="1148" height="1273" alt="다채로운 메모지와 보라색 노트" loading="lazy" />
            <details><summary><span>축제를 향한 응원</span><span className="landing-card-arrow"><img src={arrowForward} width="24" height="24" alt="" /></span></summary><p>무대 위의 친구에게, 함께 온 사람에게 따뜻한 응원을 전해보세요. 모두의 한마디가 모여 축제의 순간을 채워요.</p></details>
          </article>
          <article className="landing-service-card landing-card-lost">
            <p className="landing-card-category">Lost & Found</p><h3>잃어버린 물건도,<br />함께라면 찾을 수 있어요</h3><img className="landing-service-art landing-lost-art" src={lostArtwork} width="300" height="280" alt="분실물을 찾는 돋보기" loading="lazy" />
            <details><summary><span>분실물 게시판</span><span className="landing-card-arrow"><img src={arrowForward} width="24" height="24" alt="" /></span></summary><p>물건을 잃어버렸거나 주인 없는 물건을 발견했다면 게시판에서 확인해보세요. 사진과 장소를 함께 남길 수 있어요.</p></details>
          </article>
        </div>
      </section>

      <section id="landing-faq" className="landing-section landing-faq" aria-labelledby="landing-faq-title"><p className="landing-eyebrow">FAQ</p><h2 id="landing-faq-title">자주 묻는 질문</h2><div className="landing-faq-list">{faqs.map(item => <details key={item.question}><summary>{item.question}<img src={arrowDown} width="20" height="20" alt="" /></summary><p>{item.answer}</p></details>)}</div></section>
      <footer className="landing-footer"><img className="landing-footer-logo" src={mainLogo} width="176" height="64" alt="YU FESTA" /><p className="landing-footer-title">우리의 가을을 기다리며.</p><nav aria-label="하단 메뉴"><button type="button" onClick={() => goTo('landing-countdown')}>축제까지 남은 시간</button><button type="button" onClick={() => goTo('landing-services')}>서비스 소개</button><button type="button" onClick={() => goTo('landing-faq')}>자주 묻는 질문</button></nav><p className="landing-footer-credit">2026 YEUNGNAM UNIVERSITY FALL FESTIVAL<br />© 2026 YU FESTA</p><button className="landing-back-top" type="button" onClick={() => goTo('landing-top')}>맨 위로<img src={arrowDown} width="20" height="20" alt="" /></button></footer>
    </div>
  </AppLayout>
}
