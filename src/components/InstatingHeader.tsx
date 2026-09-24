import HomeLogo from './HomeLogo'

export default function InstatingHeader({ onHome, onProfile, editing = false }: { onHome: () => void; onProfile: () => void; editing?: boolean }) {
  return <div className={"[&_button:focus-visible]:[outline:2px_solid_#1554ff] [&_button:focus-visible]:outline-offset-[3px] instating-header"}>
    <div className={"flex items-center justify-between h-[72px] [&_>_span]:text-[9px] [&_>_span]:font-[800] [&_>_span]:tracking-[1.2px] [&_>_span]:text-[#8a95ab] [&_>_span]:leading-[1.5] [&_>_span]:text-right instating-brand"}><HomeLogo onHome={onHome} /><span>FIND YOUR<br />FESTIVAL MATE</span></div>
    <nav className={"flex gap-[22px] items-center [border-bottom:1px_solid_#e8ebf2] mx-[calc(-1_*_var(--app-content-padding))] px-[var(--app-content-padding)] whitespace-nowrap text-[13px] [&_>_*]:[padding:14px_0] [&_button]:cursor-pointer [&_button]:text-[#788196] [&_[aria-current]]:text-[#1554ff] [&_[aria-current]]:font-bold [&_[aria-current]]:[border-bottom:2px_solid_#1554ff] [@media(max-width:350px)]:gap-[15px] [@media(max-width:350px)]:text-[12px] instating-nav"} aria-label="인스타팅 메뉴">
      <button type="button" onClick={onHome}>홈</button>
      <span aria-current="page">{editing ? '신청 정보 수정' : '인스타팅 신청하기'}</span>
      <button type="button" onClick={onProfile}>마이페이지 · 결과</button>
    </nav>
  </div>
}
