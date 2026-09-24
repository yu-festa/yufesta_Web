import { useState } from 'react'
import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import SocialLoginButton from '../components/SocialLoginButton'
import type { LoginProvider } from '../components/SocialLoginButton'
import { oauthLoginUrl } from '../api/auth'

export default function Login({ onBack, onHome }: { onBack: () => void; onHome: () => void }) {
  const [message, setMessage] = useState(() => {
    const error = new URLSearchParams(window.location.search).get('error')
    return error ? '로그인을 완료하지 못했어요. 다시 시도해 주세요.' : ''
  })

  function continueWith(provider: LoginProvider) {
    setMessage(`${provider === 'google' ? 'Google' : 'Kakao'} 로그인 화면으로 이동하고 있어요.`)
    window.location.assign(oauthLoginUrl(provider))
  }

  return (
    <AppLayout header={<div className="flex h-22 items-center"><HomeLogo onHome={onHome} /></div>}>
      <div className="-ml-2 flex h-11 items-center">
        <button type="button" onClick={onBack} className="grid size-11 cursor-pointer place-items-center rounded-full text-[#222] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1554ff]" aria-label="이전 화면으로 돌아가기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>
        </button>
      </div>
      <section className="pt-7" aria-labelledby="login-title" aria-describedby="login-description">
        <h1 id="login-title" className="text-center text-[32px] leading-tight font-bold tracking-[-1px] text-black">로그인</h1>
        <p id="login-description" className="mt-4 text-center text-[13px] leading-relaxed font-medium break-keep text-[#999]">인스타팅, 분실물 게시판 작성을 위해서는 로그인이 필요해요</p>
        <div className="mt-[250px] grid gap-7">
          <SocialLoginButton provider="google" onClick={() => continueWith('google')} />
          <SocialLoginButton provider="kakao" onClick={() => continueWith('kakao')} />
        </div>
        <p className={`${message ? 'mt-4' : ''} text-center text-xs leading-relaxed break-keep text-[#777]`} role="status" aria-live="polite">{message}</p>
      </section>
    </AppLayout>
  )
}
