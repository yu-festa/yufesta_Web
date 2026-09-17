import mainLogo from '../assets/mainlogo.svg'

export default function HomeLogo({ onHome }: { onHome: () => void }) {
  return (
    <button type="button" onClick={onHome} aria-label="YU FESTA 메인 홈으로 이동" className="-ml-3 block h-16 w-44 shrink-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1554ff]">
      <img className="h-full w-full object-contain" src={mainLogo} width="176" height="64" alt="YU FESTA" />
    </button>
  )
}
