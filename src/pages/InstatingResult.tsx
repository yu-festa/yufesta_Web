import { useEffect, useRef, useState } from 'react'
import { useMotion } from '../hooks/useMotion'
import AppLayout from '../layout/AppLayout'
import { nextRevealTap, REVEAL_TAPS } from '../utils/instating'
import type { MatchResult } from '../utils/instating'
import type { InstatingParticipation } from '../utils/profile'
import purmaSuccess from '../assets/Instating/purma-success.png'
import purmaUnmatched from '../assets/Instating/purma-unmatched.png'
import closeIcon from '../assets/Instating/close.svg'
import copyIcon from '../assets/Instating/copy.svg'

const tapFrames: Keyframe[] = [{ transform: 'scale(.96) rotate(-1deg)', offset: 0 }, { transform: 'scale(1.015) rotate(1deg)', offset: .6 }, { transform: 'scale(1) rotate(0)', offset: 1 }]
const tapTiming: KeyframeAnimationOptions = { duration: 280, easing: 'ease-out' }
const openFrames: Keyframe[] = [{ opacity: 0, transform: 'perspective(800px) rotateY(-16deg) translateY(12px)' }, { opacity: 1, transform: 'none' }]
const openTiming: KeyframeAnimationOptions = { duration: 550, easing: 'ease-out' }

function Reveal({ result, isDemo, onClose }: { result: MatchResult; isDemo: boolean; onClose: () => void }) {
  const [taps, setTaps] = useState(0)
  const [copyMessage, setCopyMessage] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const revealed = taps === REVEAL_TAPS
  const tapRef = useMotion<HTMLSpanElement>(tapFrames, tapTiming, taps)
  const openRef = useMotion<HTMLDivElement>(openFrames, openTiming, revealed)
  const pending = result.status === 'pending'
  useEffect(() => { if (revealed) heading.current?.focus({ preventScroll: true }) }, [revealed])

  async function copyInstagram(instagram: string) {
    try { await navigator.clipboard.writeText(instagram); setCopyMessage('인스타그램 아이디를 복사했어요.') }
    catch { setCopyMessage('복사하지 못했어요. 아이디를 길게 눌러 복사해주세요.') }
  }

  return <section className={`[padding:38px_24px_32px] text-center text-[#172039] [&_h1]:mt-[10px] [&_h1]:text-[26px] [&_h1]:font-[750] [&_h1]:tracking-[-.9px] [&_h1]:[outline:none] [@media(max-width:350px)]:px-[18px] [@media(max-width:350px)]:[&_h1]:text-[23px] match-scene ${revealed && result.status === 'unmatched' ? "[&_.match-open-card]:[border-color:#e5e7f1] match-scene-unmatched" : ''}`}>
    <p className={"text-[13px] text-[#7a85a0] match-eyebrow"}>두근두근 인스타팅</p>
    <h1 ref={heading} tabIndex={-1}>{pending ? '아직 설렘을 준비 중이에요' : !revealed ? '나의 매칭 상대는?' : result.status === 'matched' ? '매칭 성공!' : '이번엔 아쉽게도…'}</h1>
    <p className={"mt-[10px] text-[#8690a4] text-[12px] leading-[1.8] break-keep match-description"}>{pending ? '결과 발표까지 조금만 기다려주세요.' : !revealed ? '두근두근, 카드를 5번 두드려주세요.' : result.status === 'matched' ? '축제를 함께할 새로운 친구를 만났어요.' : '다음에는 꼭 좋은 인연이 찾아올 거예요.'}</p>

    {pending ? <div className={"flex flex-col items-center [margin:28px_auto_0] [padding:32px_20px] bg-[#fff] [border:1px_solid_#e2e8f7] rounded-[16px] max-w-[330px] [&_>_span]:text-[#8cafff] [&_>_span]:text-[72px] [&_strong]:text-[13px] [&_strong]:text-[#7c8ba5] [&_strong]:mt-[16px] [&_b]:text-[26px] [&_b]:text-[#1554ff] [&_b]:mt-[10px] [&_p]:text-[12px] [&_p]:text-[#8a95a9] [&_p]:leading-[1.8] [&_p]:mt-[20px] match-pending"}><span aria-hidden="true">♡</span><strong>매칭 결과 발표</strong><b>시간 미정</b><p>발표가 완료되면 이곳에서<br />나의 결과 카드를 열어볼 수 있어요.</p></div> : !revealed ? <>
      <button type="button" className={"block w-[min(100%,280px)] h-[356px] [margin:32px_auto_0] p-[7px] [border:3px_solid_#fff] rounded-[26px] [background:linear-gradient(140deg,#e4ecff,#fff_38%,#b9caff)] [box-shadow:0_16px_44px_#7187dc33,inset_-3px_-3px_10px_#a3b9f388] cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent] match-reveal-card"} onClick={() => setTaps(nextRevealTap)} aria-label={`결과 카드 두드리기, ${taps} / ${REVEAL_TAPS}회`}>
        <span className={"flex relative flex-col items-center justify-center h-full rounded-[18px] overflow-hidden [background:radial-gradient(circle_at_50%_52%,#f2d9efb3,transparent_55%),linear-gradient(135deg,#f6f8ff,#dce6ff)] [box-shadow:inset_2px_2px_12px_#fff] [&_strong]:z-[1] [&_strong]:text-[21px] [&_strong]:text-[#3b61b8] [&_strong]:tracking-[-.7px] [&_strong]:[text-shadow:0_1px_14px_#fff] match-card-inner"} key={taps} ref={tapRef}>
          <span className={"absolute top-[24px] text-[9px] font-semibold tracking-[1.7px] text-[#8096cd] match-card-edition"}>YU FESTA · INSTA-TING</span>
          <span className={"absolute top-[66px] right-[33px] text-[white] text-[30px] match-card-star"} aria-hidden="true">✦</span>
          <span className={"absolute text-[142px] text-[#9ab7ff] [filter:blur(7px)] opacity-[.62] [transform:rotate(-8deg)] match-hidden-heart"} aria-hidden="true">♥</span>
          <strong>{taps ? `${REVEAL_TAPS - taps}번 더 두드려주세요` : '설렘을 깨워주세요'}</strong>
          <span className={"absolute bottom-[70px] flex gap-[9px] [&_i]:w-[7px] [&_i]:h-[7px] [&_i]:rounded-full [&_i]:bg-[#b6c7ed] [&_i]:[transition:background_.15s,transform_.15s] [&_[data-active=true]]:bg-[#1554ff] [&_[data-active=true]]:[transform:scale(1.2)] [@media(prefers-reduced-motion:reduce)]:[&_i]:[transition:none] match-tap-dots"} aria-hidden="true">{Array.from({ length: REVEAL_TAPS }, (_, index) => <i key={index} data-active={index < taps} />)}</span>
          <span className={"absolute bottom-[24px] text-[7px] tracking-[1.3px] text-[#8b9ac0] match-card-bottom"}>A LITTLE TAP, A NEW CONNECTION</span>
        </span>
      </button>
      <p className={"text-[11px] mt-[22px] text-[#8a95ae] match-tap-status"} role="status">{taps} / {REVEAL_TAPS} · {taps ? '조금씩 가까워지고 있어요!' : '터치하거나 Enter 키를 눌러주세요'}</p>
    </> : <div className={"bg-[#fff] [border:1px_solid_#dfe7fb] rounded-[16px] [padding:24px_22px] [margin:28px_auto_0] max-w-[350px] [box-shadow:0_12px_36px_#7187dc17] [@media(max-width:350px)]:[padding:20px_16px] match-open-card"} ref={openRef}>
      <span className={"text-[10px] text-[#728abf] font-bold tracking-[1.8px] match-card-label"}>{result.status === 'matched' ? 'A NEW CONNECTION' : 'UNTIL WE MEET'}</span>
      <img className={"block w-[230px] h-[230px] object-contain max-w-full [margin:6px_auto_14px] match-purma"} src={result.status === 'matched' ? purmaSuccess : purmaUnmatched} alt={result.status === 'matched' ? '하트를 안고 기뻐하는 푸르마' : '작은 하트를 안고 위로하는 푸르마'} width="240" height="240" />
      {result.status === 'matched' ? <div className={"grid gap-[22px] match-partners"}>{result.partners.map(partner => <div className={"[&_>_p:first-child]:text-[16px] [&_>_p:first-child]:font-bold [&_>_p:first-child]:mb-[14px] [&_>_p_>_span]:text-[12px] [&_>_p_>_span]:font-normal [&_>_p_>_span]:ml-[6px] [&_>_p_>_span]:text-[#7b89a3] match-partner"} key={partner.instagram}>
        <p>{partner.nickname}<span>님과 함께해요</span></p>
        <div className={"flex items-center justify-between gap-[10px] [padding:8px_8px_8px_14px] [border:1px_solid_#e1e8f7] rounded-[8px] text-left text-[14px] [&_>_span]:wrap-anywhere [&_>_span]:min-w-[0] [&_>_span]:select-all [&_button]:shrink-0 [&_button]:grid [&_button]:place-items-center [&_button]:w-[36px] [&_button]:h-[36px] [&_button]:cursor-pointer match-instagram"}><span>@{partner.instagram}</span><button type="button" onClick={() => void copyInstagram(partner.instagram)} aria-label={`${partner.instagram} 아이디 복사`}><img src={copyIcon} width="20" height="20" alt="" /></button></div>
        {isDemo ? <><button type="button" className={"block w-full p-[16px] text-[white] bg-[#1554ff] rounded-[8px] text-[14px] font-[650] text-center mt-[16px] cursor-pointer [&:disabled]:opacity-[.55] [&:disabled]:cursor-default match-primary"} disabled>인스타 프로필 바로가기 ↗</button><p className={"text-[10px] text-[#8a95a9] mt-[12px] match-demo-account"}>예시 계정으로, 실제 프로필 연결은 제공하지 않아요.</p></> : <a className={"block w-full p-[16px] text-[white] bg-[#1554ff] rounded-[8px] text-[14px] font-[650] text-center mt-[16px] cursor-pointer [&:disabled]:opacity-[.55] [&:disabled]:cursor-default match-primary"} href={`https://www.instagram.com/${encodeURIComponent(partner.instagram)}/`} target="_blank" rel="noopener noreferrer">인스타 프로필 바로가기 ↗</a>}
      </div>)}</div> : <div className={"[&_strong]:text-[14px] [&_strong]:leading-[1.7] [&_strong]:font-[650] [&_p]:text-[#8790a4] [&_p]:text-[12px] [&_p]:leading-[1.8] [&_p]:mt-[10px] match-unmatched-copy"}><strong>이번 회차에는 매칭이 성사되지 않았어요.</strong><p>아쉬운 마음은 푸르마가 안아줄게요.<br />축제의 즐거운 순간은 계속되니까요!</p></div>}
      <p className={"text-[#1554ff] text-[11px] leading-[1.6] mt-[10px] [&:empty]:hidden match-copy-status"} role="status">{copyMessage}</p>
    </div>}
    <button className={"mt-[26px] p-[14px] text-[12px] text-[#7987a3] cursor-pointer match-back"} type="button" onClick={onClose}>마이페이지로 돌아가기</button>
  </section>
}

export default function InstatingResult({ participation, isPreview, onClose }: { participation?: InstatingParticipation; isPreview: boolean; onClose: () => void }) {
  const [demoStatus, setDemoStatus] = useState<'matched' | 'unmatched' | 'pending'>('matched')
  const isDemo = isPreview && participation?.isDemo === true
  const result: MatchResult = isDemo ? demoStatus === 'matched' ? { status: 'matched', partners: [{ nickname: '축제친구', instagram: 'festa_friend_demo' }] } : { status: demoStatus } : participation?.result ?? { status: 'pending' }
  return <AppLayout padded={false} header={<div className={"h-[64px] grid grid-cols-[40px_1fr_40px] items-center text-center text-[16px] [&_button]:grid [&_button]:place-items-center [&_button]:w-[40px] [&_button]:h-[40px] [&_button]:cursor-pointer [&_button:focus-visible]:[outline:2px_solid_#1554ff] [&_button:focus-visible]:outline-offset-[4px] match-header"}><span /><strong>결과 조회</strong><button type="button" onClick={onClose} aria-label="결과 조회 닫기"><img src={closeIcon} width="24" height="24" alt="" /></button></div>}>
    <div className={"min-h-[calc(100dvh_-_64px)] [background:radial-gradient(ellipse_at_20%_35%,#edf2ff,transparent_70%),#f7f8ff] mb-[calc(-1_*_var(--app-content-padding))] [&_button:focus-visible]:[outline:2px_solid_#1554ff] [&_button:focus-visible]:outline-offset-[4px] [&_a:focus-visible]:[outline:2px_solid_#1554ff] [&_a:focus-visible]:outline-offset-[4px] match-page"}>
      {isDemo && <div className={"flex flex-wrap items-center justify-between gap-[8px] [padding:12px_20px] bg-[#eef2fb] [border-top:1px_solid_#e8edf7] text-[10px] text-[#738198] [&_>_div]:flex [&_>_div]:gap-[4px] [&_button]:[padding:6px_10px] [&_button]:rounded-[5px] [&_button]:cursor-pointer [&_[aria-pressed=true]]:text-[#1554ff] [&_[aria-pressed=true]]:bg-[#fff] [&_[aria-pressed=true]]:[box-shadow:0_2px_5px_#284a8410] [&_[aria-pressed=true]]:font-bold match-preview-controls"}><span>결과 화면 미리보기</span><div>{(['matched', 'unmatched', 'pending'] as const).map(status => <button key={status} type="button" aria-pressed={demoStatus === status} onClick={() => setDemoStatus(status)}>{status === 'matched' ? '성공' : status === 'unmatched' ? '실패' : '발표 대기'}</button>)}</div></div>}
      {participation ? <Reveal key={`${participation.id}-${demoStatus}`} result={result} isDemo={isDemo} onClose={onClose} /> : <section className={"[padding:60px_24px] text-center [&_h1]:text-[22px] [&_h1]:font-bold [&_p]:mt-[14px] [&_p]:text-[13px] [&_p]:text-[#7c8ba5] match-missing"}><h1>신청 내역을 찾을 수 없어요</h1><p>마이페이지에서 참여 내역을 다시 확인해주세요.</p><button type="button" className={"block w-full p-[16px] text-[white] bg-[#1554ff] rounded-[8px] text-[14px] font-[650] text-center mt-[16px] cursor-pointer [&:disabled]:opacity-[.55] [&:disabled]:cursor-default match-primary"} onClick={onClose}>마이페이지로 돌아가기</button></section>}
    </div>
  </AppLayout>
}
