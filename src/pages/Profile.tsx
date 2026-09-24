import { useRef, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import type { ProfileUser } from '../utils/profile'
import { cancelMyApplication, rejoinMatch } from '../api/match'
import type { MatchSummary } from '../api/match'

export default function Profile({ user, isPreview, onBack, onHome, onResult, onApply, onLogout, matchSummary, alreadyApplied = false, canApply = false, onChanged }: { user: ProfileUser; isPreview: boolean; onBack: () => void; onHome: () => void; onResult: (id: string) => void; onApply: () => void; onLogout?: () => Promise<void>; matchSummary?: MatchSummary | null; alreadyApplied?: boolean; canApply?: boolean; onChanged: () => Promise<void> }) {
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const logoutLock = useRef(false)

  const [action, setAction] = useState<'cancel' | 'rejoin' | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const actionLock = useRef(false)
  const canRejoin = !alreadyApplied && matchSummary?.my?.lastResult?.status === 'MATCHED' && matchSummary.my.lastResult.roundSeq < matchSummary.currentRound.seq

  async function confirmAction() {
    if (!action || actionLock.current || !canApply) return
    actionLock.current = true
    setBusy(true)
    setActionError('')
    try {
      if (action === 'cancel') await cancelMyApplication()
      else await rejoinMatch()
      setNotice(action === 'cancel' ? '신청을 취소했어요. 접수 마감 전에는 다시 신청할 수 있어요.' : '이전 신청 정보로 이번 회차에 재참여했어요.')
      setAction(null)
      await onChanged()
    } catch (error) { setActionError(error instanceof Error ? error.message : '요청을 처리하지 못했어요.') }
    finally { actionLock.current = false; setBusy(false) }
  }

  async function signOut() {
    if (!onLogout || logoutLock.current) return
    logoutLock.current = true
    setLoggingOut(true)
    setLogoutError('')
    try { await onLogout() }
    catch (error) { setLogoutError(error instanceof Error ? error.message : '로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.') }
    finally { logoutLock.current = false; setLoggingOut(false) }
  }

  return (
    <AppLayout header={<div className="flex h-22 items-center"><HomeLogo onHome={onHome} /></div>}>
      <div className={"text-[#192135] pb-[12px] [&_button:focus-visible]:[outline:2px_solid_#1554ff] [&_button:focus-visible]:outline-offset-[3px] [&_summary:focus-visible]:[outline:2px_solid_#1554ff] [&_summary:focus-visible]:outline-offset-[3px] profile-page"}>
        <div className={"grid grid-cols-[44px_1fr_44px] items-center mx-[-10px] [&_button]:grid [&_button]:place-items-center [&_button]:w-[44px] [&_button]:h-[44px] [&_button]:rounded-full [&_button]:cursor-pointer [&_h1]:text-center [&_h1]:text-[16px] [&_h1]:font-semibold profile-heading"}>
          <button type="button" onClick={onBack} aria-label="이전 화면으로 돌아가기"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg></button>
          <h1>내 프로필</h1>
        </div>

        <section className={"flex items-center gap-[20px] mt-[28px] [padding:28px_20px] rounded-[22px] [background:radial-gradient(ellipse_at_90%_0%,_#e9e5ff,_transparent_70%),_linear-gradient(120deg,_#eff5ff,_#f8faff)] [border:1px_solid_#edf1ff] profile-user"} aria-label="프로필 정보">
          <div className={"relative grid place-items-center w-[76px] h-[76px] shrink-0 [border:3px_solid_#fff] rounded-full text-[#6790ff] bg-[#dfe9ff] [box-shadow:0_6px_16px_#1554ff12] [&_>_span]:absolute [&_>_span]:right-[-3px] [&_>_span]:top-[-7px] [&_>_span]:text-[#8e8bdf] [&_>_span]:text-[22px] profile-avatar"} role="img" aria-label={`${user.name}님의 기본 프로필 이미지`}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="17" r="8" fill="currentColor" /><path d="M9 41a15 15 0 0 1 30 0" fill="currentColor" /></svg>
            <span aria-hidden="true">✦</span>
          </div>
          <div className={"min-w-[0] [&_h2]:text-[24px] [&_h2]:font-bold [&_h2]:tracking-[-.8px] [&_h2]:mt-[2px] [&_h2]:wrap-anywhere [&_h2_>_span]:text-[17px] [&_h2_>_span]:font-medium [&_h2_>_span]:ml-[3px] [&_p]:text-[12px] [&_p]:text-[#73829b] [&_p]:mt-[5px] [&_p]:wrap-anywhere profile-user-info"}><span className={"text-[#75849e] text-[12px] profile-greeting"}>반가워요!</span><h2>{user.name}<span>님</span></h2>{user.instagram && <p>@{user.instagram}</p>}</div>
        </section>
        {isPreview && <p className={"mt-[10px] text-center text-[#8a93a6] text-[11px] profile-preview"}>미리보기 · 이 브라우저의 신청 내역과 결과 체험이에요</p>}

        <section className={"mt-[36px] profile-history"} aria-labelledby="profile-history-title">
          <div className={"flex items-center gap-[9px] [&_h2]:text-[19px] [&_h2]:font-bold [&_h2]:tracking-[-.5px] [&_>_span]:grid [&_>_span]:place-items-center [&_>_span]:min-w-[23px] [&_>_span]:h-[23px] [&_>_span]:px-[5px] [&_>_span]:rounded-[8px] [&_>_span]:text-[12px] [&_>_span]:font-bold [&_>_span]:text-[#1554ff] [&_>_span]:bg-[#edf2ff] profile-history-heading"}><h2 id="profile-history-title">인스타팅 참여 내역</h2><span aria-label={`총 ${user.participations.length}건`}>{user.participations.length}</span></div>
          <p className={"text-[12px] text-[#8992a4] mt-[7px] break-keep profile-history-description"}>축제를 함께할 친구와의 설렘을 확인해보세요.</p>
          {user.participations.length ? <ul className={"grid gap-[20px] mt-[18px] profile-history-list"}>{user.participations.map(participation => <li key={participation.id}>
            <article className={"overflow-hidden [border:1px_solid_#e3e9f5] rounded-[18px] [box-shadow:0_8px_24px_#1d3b7510] profile-participation"}>
              <div className={"relative isolate overflow-hidden p-[20px] [background:linear-gradient(130deg,#f0f5ff,#e0e9ff)] text-[#18376e] [&::before]:[content:''] [&::before]:absolute [&::before]:inset-[0] [&::before]:z-[-2] [&::before]:[background:url('/src/assets/Main/InstatingBackground.webp')_72%_48%_/_cover] [&::before]:[filter:hue-rotate(-40deg)_saturate(120%)] [&::after]:[content:''] [&::after]:absolute [&::after]:inset-[0] [&::after]:z-[-1] [&::after]:[background:linear-gradient(90deg,_#071c50b3,_#0a2c684d_60%,_#1554ff0d)] [&_h3]:mt-[22px] [&_h3]:[font-family:'Rubik_One',_sans-serif] [&_h3]:font-normal [&_h3]:text-[clamp(21px,_6vw,_26px)] [&_h3]:tracking-[-.6px] [&_h3]:whitespace-nowrap [&_h3]:[text-shadow:none] [&_p]:mt-[7px] [&_p]:text-[11px] [&_p]:text-[#7790b7] [&::before]:hidden [&::after]:hidden profile-participation-cover"}><div className={"flex items-center justify-between gap-[10px] [&_>_span]:text-[10px] [&_>_span]:[padding:4px_8px] [&_>_span]:[border:1px_solid_#c6e0ff4d] [&_>_span]:rounded-[20px] [&_>_span]:bg-[#ffffff80] [&_>_span]:[backdrop-filter:blur(8px)] [&_.profile-application-status]:bg-[#e6effff0] [&_.profile-application-status]:text-[#1554ff] [&_.profile-application-status]:font-bold [&_>_span]:[border-color:#cad9f3] profile-participation-badges"}><span>{participation.round} / 추첨</span><span className="profile-application-status">{participation.isDemo ? '결과 미리보기' : participation.resultOnly ? '발표 완료' : '신청 완료'}</span></div><h3>INSTA - TING</h3><p>{participation.festival}</p></div>
              <div className={"p-[20px] profile-participation-body"}>
                <div className={"flex items-center justify-between gap-[12px] text-[13px] [&_>_span]:font-semibold [&_strong]:text-[#1554ff] [&_strong]:font-bold profile-announcement"}><span>매칭 결과</span><strong>{participation.isDemo ? '체험 가능' : participation.published || (participation.result && participation.result.status !== 'pending') ? '발표 완료' : '발표 대기'}</strong></div>
                <p className={"flex items-center gap-[8px] p-[12px] mt-[15px] bg-[#f5f7ff] rounded-[10px] text-[11px] text-[#6f7e9d] [&_>_span]:text-[#6c8fff] [&_>_span]:text-[20px] [&_>_span]:leading-[1] profile-waiting"}><span aria-hidden="true">♡</span>{participation.isDemo || (participation.published || (participation.result && participation.result.status !== 'pending')) ? '카드를 5번 두드려 결과를 확인해보세요' : '결과 발표를 기다리고 있어요'}</p>
                <button type="button" className={"flex items-center justify-between w-full p-[15px] mt-[18px] rounded-[8px] bg-[#1554ff] text-[#fff] text-[13px] font-[650] cursor-pointer profile-result-button"} onClick={() => onResult(participation.id)}>{participation.isDemo ? '결과 카드 체험하기' : '매칭 결과 확인하기'}<span aria-hidden="true">↗</span></button>
                {!participation.resultOnly && <details className={"mt-[18px] [&_summary]:flex [&_summary]:items-center [&_summary]:justify-between [&_summary]:min-h-[30px] [&_summary]:text-[12px] [&_summary]:text-[#6c768b] [&_summary]:cursor-pointer [&_summary]:list-none [&_summary::-webkit-details-marker]:hidden [&[open]_summary_svg]:[transform:rotate(180deg)] [&_dl]:grid [&_dl]:gap-[14px] [&_dl]:[border-top:1px_solid_#edf0f6] [&_dl]:pt-[16px] [&_dl]:mt-[10px] [&_dt]:text-[#8a93a6] [&_dt]:text-[11px] [&_dt]:mb-[5px] [&_dd]:text-[12px] [&_dd]:wrap-anywhere profile-application-details"}><summary>신청 정보 보기<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary><dl><div><dt>닉네임</dt><dd>{participation.nickname}</dd></div><div><dt>인스타그램</dt><dd>@{participation.instagram ?? user.instagram}</dd></div><div><dt>관심 키워드</dt><dd className={"flex flex-wrap gap-[6px] [&_>_span]:text-[#1554ff] [&_>_span]:bg-[#edf2ff] [&_>_span]:[padding:4px_8px] [&_>_span]:rounded-[6px] [&_>_span]:text-[11px] profile-interest-tags"}>{participation.interests.map(interest => <span key={interest}>{interest}</span>)}</dd></div></dl></details>}
              </div>
            </article>
          </li>)}</ul> : <div className={"text-center [padding:36px_16px] bg-[#f7f9ff] rounded-[18px] mt-[18px] [&_>_span]:text-[36px] [&_>_span]:text-[#8cafff] [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:mt-[12px] [&_p]:text-[12px] [&_p]:text-[#8992a4] [&_p]:mt-[6px] profile-empty"}><span aria-hidden="true">♡</span><h3>아직 참여한 인스타팅이 없어요</h3><p>축제를 함께 즐길 친구를 만나보세요.</p></div>}
        </section>
        {!isPreview && <div className="mt-6 space-y-3">
          {alreadyApplied ? <><p className="text-center text-xs text-[#63708a]">이번 회차 신청 완료 · 마감 전까지 취소할 수 있어요.</p><button type="button" disabled={!canApply || busy} className="w-full rounded-xl border border-red-200 p-3 text-sm text-red-700 disabled:opacity-40" onClick={() => { setAction('cancel'); setActionError(''); setNotice('') }}>신청 취소하기</button></>
            : canRejoin ? <button type="button" disabled={!canApply || busy} className="w-full rounded-xl bg-[#1554ff] p-4 text-sm font-semibold text-white disabled:opacity-40" onClick={() => { setAction('rejoin'); setActionError(''); setNotice('') }}>이번 회차 재참여하기</button>
            : <button type="button" disabled={!canApply || busy} className="w-full rounded-xl bg-[#edf3ff] p-4 text-sm font-semibold text-[#1554ff] disabled:opacity-40" onClick={onApply}>인스타팅 신청하기</button>}
          {!canApply && <p className="text-center text-xs text-[#63708a]">접수 기간이 아니거나 신청 상태를 확인 중이에요.</p>}
          {action && <div className="rounded-xl border border-[#dce5f5] p-4" role="group" aria-label={action === 'cancel' ? '신청 취소 확인' : '재참여 확인'}><p className="text-sm">{action === 'cancel' ? '이번 회차 신청을 취소할까요?' : '이전 회차의 신청 정보로 다시 참여할까요?'}</p><div className="mt-3 flex gap-3"><button type="button" disabled={busy || !canApply} className="rounded-lg bg-[#1554ff] px-4 py-2 text-sm text-white disabled:opacity-40" onClick={() => void confirmAction()}>{busy ? '처리 중…' : '확인'}</button><button type="button" disabled={busy} className="rounded-lg border px-4 py-2 text-sm" onClick={() => setAction(null)}>돌아가기</button></div></div>}
          {notice && <p role="status" className="text-sm text-[#1554ff]">{notice}</p>}
          {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
        </div>}
        <button type="button" className={"w-full min-h-[48px] mt-[12px] [border:1px_solid_#dfe6f6] rounded-[12px] text-[#66758e] text-[13px] font-semibold cursor-pointer [&:hover]:bg-[#f6f8ff] profile-home"} onClick={onHome}>홈으로 돌아가기</button>
        {onLogout && <button type="button" className={"w-full min-h-[48px] mt-[10px] text-[#8992a4] text-[12px] cursor-pointer disabled:cursor-wait disabled:opacity-60 profile-logout"} onClick={() => void signOut()} disabled={loggingOut}>{loggingOut ? '로그아웃 중…' : '로그아웃'}</button>}
        {logoutError && <p className="mt-2 text-center text-xs text-red-700" role="alert">{logoutError}</p>}
      </div>
    </AppLayout>
  )
}
