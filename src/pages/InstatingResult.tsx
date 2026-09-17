import { useEffect, useRef, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import { nextRevealTap, REVEAL_TAPS } from '../utils/instating'
import type { MatchResult } from '../utils/instating'
import type { InstatingParticipation } from '../utils/profile'
import purmaSuccess from '../assets/Instating/purma-success.png'
import purmaUnmatched from '../assets/Instating/purma-unmatched.png'
import closeIcon from '../assets/Instating/close.svg'
import copyIcon from '../assets/Instating/copy.svg'
import './InstatingResult.css'

function Reveal({ result, isDemo, onClose }: { result: MatchResult; isDemo: boolean; onClose: () => void }) {
  const [taps, setTaps] = useState(0)
  const [copyMessage, setCopyMessage] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const revealed = taps === REVEAL_TAPS
  const pending = result.status === 'pending'
  useEffect(() => { if (revealed) heading.current?.focus({ preventScroll: true }) }, [revealed])

  async function copyInstagram(instagram: string) {
    try { await navigator.clipboard.writeText(instagram); setCopyMessage('인스타그램 아이디를 복사했어요.') }
    catch { setCopyMessage('복사하지 못했어요. 아이디를 길게 눌러 복사해주세요.') }
  }

  return <section className={`match-scene ${revealed && result.status === 'unmatched' ? 'match-scene-unmatched' : ''}`}>
    <p className="match-eyebrow">두근두근 인스타팅</p>
    <h1 ref={heading} tabIndex={-1}>{pending ? '아직 설렘을 준비 중이에요' : !revealed ? '나의 매칭 상대는?' : result.status === 'matched' ? '매칭 성공!' : '이번엔 아쉽게도…'}</h1>
    <p className="match-description">{pending ? '결과 발표까지 조금만 기다려주세요.' : !revealed ? '두근두근, 카드를 5번 두드려주세요.' : result.status === 'matched' ? '축제를 함께할 새로운 친구를 만났어요.' : '다음에는 꼭 좋은 인연이 찾아올 거예요.'}</p>

    {pending ? <div className="match-pending"><span aria-hidden="true">♡</span><strong>매칭 결과 발표</strong><b>시간 미정</b><p>발표가 완료되면 이곳에서<br />나의 결과 카드를 열어볼 수 있어요.</p></div> : !revealed ? <>
      <button type="button" className="match-reveal-card" onClick={() => setTaps(nextRevealTap)} aria-label={`결과 카드 두드리기, ${taps} / ${REVEAL_TAPS}회`}>
        <span className="match-card-inner" key={taps}>
          <span className="match-card-edition">YU FESTA · INSTA-TING</span>
          <span className="match-card-star" aria-hidden="true">✦</span>
          <span className="match-hidden-heart" aria-hidden="true">♥</span>
          <strong>{taps ? `${REVEAL_TAPS - taps}번 더 두드려주세요` : '설렘을 깨워주세요'}</strong>
          <span className="match-tap-dots" aria-hidden="true">{Array.from({ length: REVEAL_TAPS }, (_, index) => <i key={index} data-active={index < taps} />)}</span>
          <span className="match-card-bottom">A LITTLE TAP, A NEW CONNECTION</span>
        </span>
      </button>
      <p className="match-tap-status" role="status">{taps} / {REVEAL_TAPS} · {taps ? '조금씩 가까워지고 있어요!' : '터치하거나 Enter 키를 눌러주세요'}</p>
    </> : <div className="match-open-card">
      <span className="match-card-label">{result.status === 'matched' ? 'A NEW CONNECTION' : 'UNTIL WE MEET'}</span>
      <img className="match-purma" src={result.status === 'matched' ? purmaSuccess : purmaUnmatched} alt={result.status === 'matched' ? '하트를 안고 기뻐하는 푸르마' : '작은 하트를 안고 위로하는 푸르마'} width="240" height="240" />
      {result.status === 'matched' ? <div className="match-partners">{result.partners.map(partner => <div className="match-partner" key={partner.instagram}>
        <p>{partner.nickname}<span>님과 함께해요</span></p>
        <div className="match-instagram"><span>@{partner.instagram}</span><button type="button" onClick={() => void copyInstagram(partner.instagram)} aria-label={`${partner.instagram} 아이디 복사`}><img src={copyIcon} width="20" height="20" alt="" /></button></div>
        {isDemo ? <><button type="button" className="match-primary" disabled>인스타 프로필 바로가기 ↗</button><p className="match-demo-account">예시 계정으로, 실제 프로필 연결은 제공하지 않아요.</p></> : <a className="match-primary" href={`https://www.instagram.com/${encodeURIComponent(partner.instagram)}/`} target="_blank" rel="noopener noreferrer">인스타 프로필 바로가기 ↗</a>}
      </div>)}</div> : <div className="match-unmatched-copy"><strong>이번 회차에는 매칭이 성사되지 않았어요.</strong><p>아쉬운 마음은 푸르마가 안아줄게요.<br />축제의 즐거운 순간은 계속되니까요!</p></div>}
      <p className="match-copy-status" role="status">{copyMessage}</p>
    </div>}
    <button className="match-back" type="button" onClick={onClose}>마이페이지로 돌아가기</button>
  </section>
}

export default function InstatingResult({ participation, isPreview, onClose }: { participation?: InstatingParticipation; isPreview: boolean; onClose: () => void }) {
  const [demoStatus, setDemoStatus] = useState<'matched' | 'unmatched' | 'pending'>('matched')
  const isDemo = isPreview && participation?.isDemo === true
  const result: MatchResult = isDemo ? demoStatus === 'matched' ? { status: 'matched', partners: [{ nickname: '축제친구', instagram: 'festa_friend_demo' }] } : { status: demoStatus } : participation?.result ?? { status: 'pending' }
  return <AppLayout padded={false} header={<div className="match-header"><span /><strong>결과 조회</strong><button type="button" onClick={onClose} aria-label="결과 조회 닫기"><img src={closeIcon} width="24" height="24" alt="" /></button></div>}>
    <div className="match-page">
      {isDemo && <div className="match-preview-controls"><span>결과 화면 미리보기</span><div>{(['matched', 'unmatched', 'pending'] as const).map(status => <button key={status} type="button" aria-pressed={demoStatus === status} onClick={() => setDemoStatus(status)}>{status === 'matched' ? '성공' : status === 'unmatched' ? '실패' : '발표 대기'}</button>)}</div></div>}
      {participation ? <Reveal key={`${participation.id}-${demoStatus}`} result={result} isDemo={isDemo} onClose={onClose} /> : <section className="match-missing"><h1>신청 내역을 찾을 수 없어요</h1><p>마이페이지에서 참여 내역을 다시 확인해주세요.</p><button type="button" className="match-primary" onClick={onClose}>마이페이지로 돌아가기</button></section>}
    </div>
  </AppLayout>
}
