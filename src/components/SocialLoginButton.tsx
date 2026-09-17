export type LoginProvider = 'google' | 'kakao'

type SocialLoginButtonProps = {
  provider: LoginProvider
  onClick: () => void
}

function GoogleIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.36Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.24-2.51c-.9.6-2.05.96-3.37.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.92V7.49H3.07A10 10 0 0 0 2 12c0 1.61.38 3.14 1.07 4.51l3.34-2.59Z" />
    <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.61 9.61 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z" />
  </svg>
}

function KakaoIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#000" d="M12 3C6.48 3 2 6.53 2 10.88c0 2.8 1.86 5.25 4.65 6.65l-1.18 4.02c-.1.34.27.6.56.4l4.71-3.14c.41.04.83.06 1.26.06 5.52 0 10-3.57 10-7.99S17.52 3 12 3Z" />
  </svg>
}

export default function SocialLoginButton({ provider, onClick }: SocialLoginButtonProps) {
  const isGoogle = provider === 'google'
  return (
    <button type="button" onClick={onClick} className={`grid min-h-14 w-full cursor-pointer grid-cols-[24px_minmax(0,1fr)_24px] items-center gap-2 rounded-lg px-5 py-3 text-[clamp(15px,4.5vw,19px)] leading-normal font-medium tracking-[-0.5px] text-[#222] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1554ff] ${isGoogle ? 'bg-[#f2f2f2] hover:bg-[#e9e9e9] active:bg-[#e0e0e0]' : 'bg-[#fee500] hover:bg-[#f4dc00] active:bg-[#e8d200]'}`}>
      {isGoogle ? <GoogleIcon /> : <KakaoIcon />}
      <span className="whitespace-nowrap">{isGoogle ? 'Google' : 'Kakao'} 계정으로 계속</span>
      <span aria-hidden="true" />
    </button>
  )
}
