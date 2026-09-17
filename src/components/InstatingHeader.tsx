import HomeLogo from './HomeLogo'

export default function InstatingHeader({ onHome, onProfile }: { onHome: () => void; onProfile: () => void }) {
  return <div className="instating-header">
    <div className="instating-brand"><HomeLogo onHome={onHome} /><span>FIND YOUR<br />FESTIVAL MATE</span></div>
    <nav className="instating-nav" aria-label="인스타팅 메뉴">
      <button type="button" onClick={onHome}>홈</button>
      <span aria-current="page">인스타팅 신청하기</span>
      <button type="button" onClick={onProfile}>마이페이지 · 결과</button>
    </nav>
  </div>
}
