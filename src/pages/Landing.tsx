import { useEffect, useRef, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import { useMotion } from '../hooks/useMotion'
import { getFestivalCountdown } from '../utils/festivalLaunch'
import mainLogo from '../assets/mainlogo.svg'
import purmaArtwork from '../assets/Landing/purma-guitar.png'
import heroBackground from '../assets/Landing/starfield-blue.png'
import instatingArtwork from '../assets/Main/InstatingBackground.webp'
import mapArtwork from '../assets/Main/Map.svg'
import lostArtwork from '../assets/Main/Find.svg'

const faqs = [
  { question: '축제 서비스는 언제 열리나요?', answer: '2026년 10월 2일 0시, 축제 시작과 함께 열려요. 카운트다운이 끝나면 메인 화면으로 자동으로 이동해요.' },
  { question: '로그인이 꼭 필요한가요?', answer: '공연 타임테이블과 축제 지도는 로그인 없이 확인할 수 있어요. 인스타팅 신청과 분실물 게시판 글쓰기에는 로그인이 필요해요.' },
  { question: '타임테이블을 저장할 수 있나요?', answer: '메인 화면에서 타임테이블을 열고 저장 버튼을 누르면 이미지로 저장할 수 있어요. 축제를 즐기면서 편하게 꺼내보세요.' },
]

const features = [
  { id: 'stage', tab: '공연', title: '공연 시간, 미리 확인하세요', description: '무대별 공연 순서를 확인하고 타임테이블을 이미지로 저장할 수 있어요.' },
  { id: 'map', tab: '지도', title: '필요한 장소를 찾아보세요', description: '공연장과 화장실 위치를 지도에서 확인하세요. 현재 위치도 함께 볼 수 있어요.' },
  { id: 'instating', tab: '인스타팅', title: '축제를 함께할 친구 찾기', description: '관심사가 비슷한 친구를 만나보세요. 신청 내역과 매칭 결과는 마이페이지에서 확인할 수 있어요.' },
]

const entranceFrames: Keyframe[] = [{ opacity: 0, transform: 'translateY(18px) scale(.96)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }]
const entranceTiming: KeyframeAnimationOptions = { duration: 1000, easing: 'cubic-bezier(.2,.7,.2,1)' }
const sectionClass = 'px-6 @max-[350px]:px-5'

function Arrow({ className = '' }: { className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
}

function LandingCountdown({ target }: { target: number }) {
  const [remaining, setRemaining] = useState(() => getFestivalCountdown(Date.now(), target))
  useEffect(() => {
    const update = () => setRemaining(getFestivalCountdown(Date.now(), target))
    update()
    const timer = setInterval(update, 1000)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => { clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update) }
  }, [target])
  const units = [{ value: remaining.days, label: '일' }, { value: remaining.hours, label: '시' }, { value: remaining.minutes, label: '분' }, { value: remaining.seconds, label: '초' }]
  return <div className="grid grid-cols-4 gap-2 py-7 @max-[350px]:gap-1.5" role="timer" aria-live="off" aria-label={`축제까지 ${units.map(unit => `${unit.value}${unit.label}`).join(' ')}`}>
    {units.map(unit => <div className="flex min-w-0 items-end gap-1 @max-[350px]:gap-0.5" key={unit.label} aria-hidden="true">
      <div className="flex min-w-0 flex-1 gap-1 @max-[350px]:gap-0.5">
        {String(unit.value).padStart(2, '0').split('').map((digit, index) => <span key={index} className="grid h-[clamp(48px,14cqw,64px)] min-w-0 flex-1 place-items-center rounded-xl border border-white/25 bg-white/[.08] text-[clamp(24px,7.5cqw,36px)] leading-none font-bold tabular-nums text-white shadow-[0_8px_24px_#00000040,inset_0_1px_0_#ffffff66,inset_0_-1px_0_#0000001a]">{digit}</span>)}
      </div>
      <span className="mb-1.5 shrink-0 text-[11px] leading-none font-normal text-[#c8d5ea]">{unit.label}</span>
    </div>)}
  </div>
}

function FeatureArtwork({ id }: { id: string }) {
  if (id === 'stage') return <div className="relative mx-5 mb-5 overflow-hidden rounded-2xl bg-[#eef3ff] p-5 text-[#182747]" aria-label="축제 타임테이블 안내">
    <p className="mb-5 text-[13px] font-bold text-[#1b48bf]">축제 타임테이블</p>
    <div className="grid grid-cols-[25px_1fr] gap-x-3"><div className="flex flex-col items-center pt-2 text-[#2860eb]" aria-hidden="true"><span className="size-2 rounded-full bg-current" /><span className="my-2 h-12 w-px bg-[#c4d4f8]" /><span className="size-2 rounded-full border-2 border-current" /></div><div className="space-y-3"><div className="flex items-center gap-3 rounded-xl bg-[#1554ff] p-3.5 text-white shadow-[0_6px_18px_#1554ff25]"><span className="text-2xl" aria-hidden="true">♫</span><div><strong className="block text-[12px]">공연 시간과 순서</strong><span className="mt-1 block text-[9px] text-blue-100">무대별 일정을 한눈에</span></div></div><div className="flex items-center gap-3 rounded-xl border border-[#dfe7f9] bg-white p-3.5"><span className="text-2xl text-[#7d9ae7]" aria-hidden="true">♪</span><div><strong className="block text-[12px]">타임테이블 저장</strong><span className="mt-1 block text-[9px] text-[#7785a2]">이미지로 저장하고 다시 확인</span></div></div></div></div>
  </div>
  if (id === 'map') return <div className="relative mx-5 mb-5 flex min-h-57 items-center justify-center overflow-hidden rounded-2xl bg-[#edf6f6]">
    <div className="absolute inset-0 bg-[linear-gradient(#d4e7e766_1px,transparent_1px),linear-gradient(90deg,#d4e7e766_1px,transparent_1px)] bg-size-[28px_28px]" aria-hidden="true" />
    <img src={mapArtwork} alt="축제 장소를 찾는 지도와 위치 핀" className="relative size-40 object-contain" width="160" height="160" loading="lazy" />
    <span className="absolute top-5 left-4 rounded-full border border-white bg-white/90 px-3 py-2 text-[10px] font-semibold text-[#397571] shadow-sm">공연장 찾기 ↗</span><span className="absolute right-4 bottom-5 rounded-full border border-white bg-white/90 px-3 py-2 text-[10px] font-semibold text-[#397571] shadow-sm">현재 위치 확인</span>
  </div>
  return <div className="relative isolate mx-5 mb-5 flex min-h-57 flex-col justify-end overflow-hidden rounded-2xl bg-[#061a3c] p-5 text-white">
    <img src={instatingArtwork} alt="별빛 속에서 반짝이는 하트" className="absolute inset-0 -z-10 size-full object-cover object-[70%_center] hue-rotate-[-48deg]" width="1536" height="1024" loading="lazy" />
    <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#061a3c] via-[#061a3c]/10 to-transparent" />
    <span className="text-[24px] font-black tracking-[-1px]">INSTA-TING</span><span className="mt-1.5 text-[11px] text-blue-100">관심사가 비슷한 친구와 함께하세요.</span>
  </div>
}

export default function Landing({ target }: { target: number }) {
  const [activeFeature, setActiveFeature] = useState(0)
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])
  const artworkRef = useMotion<HTMLDivElement>(entranceFrames, entranceTiming)
  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  return <AppLayout padded={false}>
    <div className="@container -mb-(--app-content-padding) [font-family:Pretendard,sans-serif] bg-[#05132e] text-[#f5f8ff] [&_button]:cursor-pointer [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#6698ff] [&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:outline-offset-4 [&_summary:focus-visible]:outline-[#6698ff] [&_section]:scroll-mt-6" id="landing-top">
      <section className="relative isolate overflow-hidden bg-[#05132e] pb-17 text-white" aria-labelledby="landing-title">
        <img src={heroBackground} alt="" width="1024" height="1536" fetchPriority="high" className="pointer-events-none absolute inset-0 -z-20 size-full object-cover object-center" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-[#041127]/45 via-transparent to-[#061d48]/20" />
        <header className="flex h-20 items-center justify-between px-5">
          <button type="button" onClick={() => goTo('landing-top')} className="-ml-2 w-34" aria-label="YU FESTA 랜딩 처음으로"><img src={mainLogo} alt="YU FESTA" width="176" height="64" className="h-12 w-full object-contain brightness-0 invert" /></button>
          <button type="button" onClick={() => goTo('landing-services')} className="flex min-h-11 items-center gap-2 text-[12px] font-medium text-blue-100">서비스 안내<Arrow className="size-4 -rotate-45" /></button>
        </header>
        <div className="px-7 pt-9 @max-[350px]:px-5">
          <p className="text-[12px] font-medium tracking-[.3px] text-[#bfd3f1]">2026 영남대학교 가을축제</p>
          <h1 id="landing-title" className="mt-4 text-[clamp(32px,9.5cqw,44px)] leading-[1.25] font-bold tracking-[-1.6px]">10월 2일,<br />축제에서 만나요.</h1>
          <p className="mt-5 text-[13px] leading-6 text-[#c2d3ef]">공연 시간부터 축제 지도까지.<br />필요한 정보는 여기서 확인하세요.</p>
        </div>
        <div ref={artworkRef} className="relative mx-auto mt-7 w-[90%] max-w-94">
          <img src={purmaArtwork} alt="파란 기타를 연주하는 푸르마" className="relative h-auto max-h-80 w-full object-contain drop-shadow-[0_14px_24px_#03174e60]" width="992" height="1340" />
        </div>
      </section>

      <div className="bg-[linear-gradient(180deg,#071a3c_0%,#103362_22%,#0a264f_48%,#06162e_76%,#0a2854_100%)]">
      <section id="landing-countdown" className={`${sectionClass} pt-10 pb-16 text-center`} aria-labelledby="landing-countdown-title">
        <h2 id="landing-countdown-title" className="text-[18px] leading-7 font-semibold tracking-[-.3px]">축제까지 남은 시간</h2>
        <LandingCountdown target={target} />
        <p className="text-[13px] leading-6 text-[#a4b9d8]"><time dateTime="2026-10-02T00:00:00+09:00" className="font-semibold text-[#88bcff]">10월 2일 0시</time>에 메인 화면이 열려요.</p>
        <button type="button" onClick={() => goTo('landing-services')} className="mx-auto mt-7 flex min-h-12 items-center justify-center gap-3 rounded-full border border-[#b4d5ff]/30 bg-linear-to-r from-[#1554ff]/35 to-[#64c0ff]/25 px-7 text-[15px] font-bold text-white backdrop-blur-sm transition-colors hover:from-[#1554ff]/60 hover:to-[#64c0ff]/40 motion-reduce:transition-none">서비스 둘러보기<Arrow className="size-4 rotate-90" /></button>
      </section>

      <section id="landing-services" className={`${sectionClass} border-t border-white/10 pt-14 pb-10`} aria-labelledby="landing-services-title">
        <h2 id="landing-services-title" className="text-[clamp(26px,8cqw,34px)] leading-[1.4] font-extrabold tracking-[-.8px]">축제 가기 전에<br />확인해보세요.</h2>
        <p className="mt-4 text-[15px] leading-7 text-[#adc0de]">공연 시간, 장소, 인스타팅까지 한곳에서.</p>
        <div className="mt-7 flex border-b border-white/15" role="tablist" aria-label="축제 서비스 안내">
          {features.map((item, index) => <button key={item.id} ref={element => { tabsRef.current[index] = element }} type="button" role="tab" id={`landing-tab-${item.id}`} aria-controls={`landing-panel-${item.id}`} aria-selected={activeFeature === index} tabIndex={activeFeature === index ? 0 : -1} onClick={() => setActiveFeature(index)} onKeyDown={event => {
            let next = index
            if (event.key === 'ArrowRight') next = (index + 1) % features.length
            else if (event.key === 'ArrowLeft') next = (index + features.length - 1) % features.length
            else if (event.key === 'Home') next = 0
            else if (event.key === 'End') next = features.length - 1
            else return
            event.preventDefault(); setActiveFeature(next); tabsRef.current[next]?.focus()
          }} className={`-mb-px min-h-12 min-w-0 flex-1 border-b-2 text-[14px] font-semibold transition-colors motion-reduce:transition-none ${activeFeature === index ? 'border-[#82b8ff] text-[#9acaff]' : 'border-transparent text-[#9aacca] hover:text-white'}`}>{item.tab}</button>)}
        </div>
        {features.map((feature, index) => <div key={feature.id} hidden={activeFeature !== index} role="tabpanel" id={`landing-panel-${feature.id}`} aria-labelledby={`landing-tab-${feature.id}`} tabIndex={0} className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[.035] outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#6698ff]">
          <div className="px-5 pt-6 pb-5"><h3 className="text-[22px] leading-[1.4] font-bold tracking-[-.5px] break-keep">{feature.title}</h3><p className="mt-3 min-h-14 text-[14px] leading-7 break-keep text-[#b0c1dc]">{feature.description}</p></div>
          <FeatureArtwork id={feature.id} />
        </div>)}
        <p className="mt-4 text-center text-[12px] text-[#94a8ca]">10월 2일부터 이용할 수 있어요.</p>
      </section>

      <section className={`${sectionClass} pb-16`} aria-labelledby="landing-together-title">
        <div className="mb-5 flex items-center gap-3"><h2 id="landing-together-title" className="text-[20px] font-bold tracking-[-.5px]">이런 기능도 있어요</h2><span className="h-px flex-1 bg-white/15" /></div>
        <div className="grid grid-cols-2 gap-3">
          <article className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white/5 p-4"><div className="mb-4 flex h-18 items-center justify-center" aria-hidden="true"><span className="-rotate-8 rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-[13px] font-bold text-[#3162d1] shadow-[4px_6px_0_#c8d8ff]">응원해요 <span className="text-[#7399ff]">✦</span></span></div><h3 className="text-[14px] font-bold break-keep">함께하는 응원</h3><p className="mt-2 text-[12px] leading-6 break-keep text-[#a5b8d6]">친구와 공연팀에게<br />응원을 남겨보세요.</p></article>
          <article className="rounded-[20px] border border-white/10 bg-white/5 p-4"><img src={lostArtwork} alt="" className="mx-auto mb-4 h-18 w-22 object-contain" width="88" height="72" loading="lazy" /><h3 className="text-[14px] font-bold break-keep">분실물 찾기</h3><p className="mt-2 text-[12px] leading-6 break-keep text-[#a5b8d6]">잃어버린 물건을<br />사진으로 찾아보세요.</p></article>
        </div>
      </section>

      <section id="landing-faq" className={`${sectionClass} border-t border-white/10 py-14`} aria-labelledby="landing-faq-title">
        <h2 id="landing-faq-title" className="text-[28px] font-extrabold tracking-[-.7px]">자주 묻는 질문</h2>
        <div className="mt-7 divide-y divide-white/10">{faqs.map(item => <details key={item.question} className="group py-1"><summary className="flex min-h-15 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[15px] leading-7 font-semibold [&::-webkit-details-marker]:hidden"><span>{item.question}</span><span aria-hidden="true" className="text-[22px] font-light text-[#93b8ed] transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span></summary><p className="pb-5 pr-5 text-[14px] leading-7 break-keep text-[#afc1dc]">{item.answer}</p></details>)}</div>
      </section>

      <footer className={`${sectionClass} border-t border-white/10 pt-11 pb-8`}>
        <p className="text-[28px] leading-[1.4] font-extrabold tracking-[-.7px] text-[#b5d8ff]">10월 2일에 만나요.</p>
        <button type="button" onClick={() => goTo('landing-countdown')} className="mt-5 inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[#a0c9ff]">축제까지 남은 시간<Arrow className="size-4 -rotate-90" /></button>
        <div className="mt-10 flex items-center justify-between border-t border-white/15 pt-5"><img src={mainLogo} alt="YU FESTA" className="-ml-2 h-10 w-28 object-contain brightness-0 invert" width="176" height="64" /><button type="button" className="grid size-11 place-items-center rounded-full border border-white/25 text-[#c4d9f7]" onClick={() => goTo('landing-top')} aria-label="맨 위로"><Arrow className="-rotate-90" /></button></div><p className="mt-3 text-[10px] leading-5 tracking-[.7px] text-[#92a8cc]">YEUNGNAM UNIVERSITY · FALL FESTIVAL<br />© 2026 YU FESTA</p>
      </footer>
      </div>
    </div>
  </AppLayout>
}
