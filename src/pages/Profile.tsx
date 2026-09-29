import { useCallback, useMemo, useRef, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import ResourceStatus from '../components/ResourceStatus'
import NoticeNotificationActions from '../components/NoticeNotificationActions'
import ProfileMatchCard, { ProfileChevron, ProfileSchedule, profileButton } from '../components/ProfileMatchCard'
import { usePublicResource } from '../hooks/usePublicResource'
import { buildProfileRoundCards, getProfileResultHistory, matchClock, profileServerNow } from '../utils/profileHistory'
import type { ProfileUser } from '../utils/profile'
import { cancelMyApplication, rejoinMatch } from '../api/match'
import type { MatchSummary, MatchApplication } from '../api/match'
import { isMatchOpen } from '../utils/match'
import purma from '../assets/Instating/purma-success.png'

type ProfileProps = {
  user: ProfileUser; isPreview: boolean; onBack: () => void; onResult: (id: string) => void; onApply: () => void
  onLogout?: () => Promise<void>; matchSummary?: MatchSummary | null; alreadyApplied?: boolean; canApply?: boolean
  onChanged: () => Promise<void>; application?: MatchApplication | null; onEdit: () => void; receivedAt: number; now: number
}

export default function Profile({ user, isPreview, onBack, onResult, onApply, onLogout, matchSummary, alreadyApplied = false, canApply = false, onChanged, application, onEdit, receivedAt, now }: ProfileProps) {
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const logoutLock = useRef(false)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const profileImageUrl = user.profileImageUrl && user.profileImageUrl !== failedImageUrl ? user.profileImageUrl : null
  const [cancelTarget, setCancelTarget] = useState<{ id: number; roundSeq: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const actionLock = useRef(false)
  const currentRound = matchSummary?.currentRound
  const roundOpen = isMatchOpen(matchSummary ?? null, receivedAt, now)
  const lastRoundSeq = isPreview ? undefined : matchSummary?.my?.lastResult?.roundSeq
  // 접수 시작·이월·취소 때에도 서버의 재참여 가능 여부를 새로 확인합니다.
  const historyQuery = useMemo(() => ({ lastRoundSeq, roundOpen, currentRoundSeq: currentRound?.seq, alreadyApplied }), [lastRoundSeq, roundOpen, currentRound?.seq, alreadyApplied])
  const loadResults = useCallback(() => getProfileResultHistory(historyQuery.lastRoundSeq), [historyQuery])
  const history = usePublicResource(loadResults)
  const results = history.data?.filter(result => lastRoundSeq !== undefined && result.roundSeq <= lastRoundSeq) ?? []
  const latestResult = results.find(result => result.roundSeq === lastRoundSeq)
  const cards = buildProfileRoundCards(user.participations, application, matchSummary, results)
  const serverNow = profileServerNow(matchSummary, receivedAt, now)
  const accepting = !isPreview && canApply && roundOpen
  const canManage = accepting && !!application && application.roundSeq === currentRound?.seq
  const currentApplied = alreadyApplied || !!application && application.roundSeq === currentRound?.seq
  const finished = currentRound?.status === 'PUBLISHED' && !matchSummary?.nextRound
  const offerApplication = !isPreview && currentRound && !currentApplied && !finished && currentRound.status !== 'PUBLISHED'
  const previousMatched = matchSummary?.my?.lastResult?.status === 'MATCHED' && lastRoundSeq !== currentRound?.seq
  const canRejoin = accepting && !!latestResult && latestResult.nextRoundSeq === currentRound?.seq && latestResult.canRejoin && !latestResult.hasNextRoundApplication
  const checkingRejoin = previousMatched && (history.loading || !!history.error || !latestResult)
  const joinEnabled = accepting && !busy && (!previousMatched || !!canRejoin) && !checkingRejoin
  const cancelVisible = cancelTarget && application?.id === cancelTarget.id && application.roundSeq === cancelTarget.roundSeq

  async function confirmCancel() {
    if (!cancelVisible || actionLock.current || !canManage) return
    actionLock.current = true; setBusy(true); setActionError('')
    try {
      await cancelMyApplication()
      setNotice('신청을 취소했어요. 접수 마감 전에는 다시 신청할 수 있어요.')
      setCancelTarget(null)
      await onChanged()
      await history.refresh()
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : '신청을 취소하지 못했어요.') }
    finally { actionLock.current = false; setBusy(false) }
  }

  async function join() {
    if (!joinEnabled || actionLock.current) return
    if (!previousMatched) { onApply(); return }
    if (!canRejoin) return
    actionLock.current = true; setBusy(true); setActionError(''); setNotice('')
    try {
      await rejoinMatch()
      setNotice(`${currentRound!.seq}차 신청이 완료됐어요.`)
      await onChanged()
      await history.refresh()
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : '재참여하지 못했어요.') }
    finally { actionLock.current = false; setBusy(false) }
  }

  async function signOut() {
    if (!onLogout || logoutLock.current || actionLock.current) return
    logoutLock.current = true; setLoggingOut(true); setLogoutError('')
    try { await onLogout() }
    catch (reason) { setLogoutError(reason instanceof Error ? reason.message : '로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.') }
    finally { logoutLock.current = false; setLoggingOut(false) }
  }

  return <AppLayout>
    <div className="pb-3 text-[#171717] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-[#1554ff] [&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:outline-offset-3 [&_summary:focus-visible]:outline-[#1554ff]">
      <header className="-mx-2 grid h-14 grid-cols-[44px_1fr_44px] items-center">
        <button type="button" onClick={onBack} aria-label="이전 화면으로 돌아가기" className="grid size-11 cursor-pointer place-items-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg></button>
        <h1 className="text-center text-base font-semibold">마이페이지</h1>
      </header>

      <section className="mt-3 flex items-center gap-3" aria-label="프로필 정보">
        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eff3ff] text-base font-bold text-[#1554ff]" role="img" aria-label={`${user.name}님의 ${profileImageUrl ? '프로필 사진' : '기본 프로필 이미지'}`}>
          {profileImageUrl ? <img key={profileImageUrl} src={profileImageUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" onError={() => setFailedImageUrl(profileImageUrl)} /> : user.name.trim().slice(-1)}
        </div>
        <div className="min-w-0"><h2 className="text-lg leading-snug font-bold tracking-[-0.5px] wrap-anywhere">{user.name}님</h2>{user.instagram && <p className="mt-0.5 text-xs wrap-anywhere text-[#808080]">@{user.instagram}</p>}</div>
      </section>
      {isPreview && <p className="mt-3 text-xs text-[#808080]">미리보기 · 실제 신청 내역이 아니에요</p>}

      <section className="mt-7" aria-labelledby="profile-history-title">
        <p className="text-xs text-[#808080]">신청한 회차와 발표 결과</p>
        <h2 id="profile-history-title" className="mt-1 text-lg font-bold tracking-[-0.5px]">인스타팅 신청 내역</h2>
        <div className="mt-6 space-y-3">
          {cards.length > 0 && <ul className="space-y-3">{cards.map(card => <li key={card.participation.id}><ProfileMatchCard card={card} now={serverNow} busy={busy || loggingOut} canManage={canManage && card.application?.id === application?.id} onEdit={onEdit} onResult={() => onResult(card.participation.id)} onCancel={() => { if (card.application && canManage) { setCancelTarget({ id: card.application.id, roundSeq: card.application.roundSeq }); setActionError(''); setNotice('') } }} /></li>)}</ul>}
          {cards.length === 0 && !currentApplied && <div className="rounded-[8px] bg-[#eff3ff] px-5 pb-5 pt-6 text-center">
            <img src={purma} alt="" className="mx-auto size-24 object-contain" />
            <h3 className="mt-3 text-base font-bold">아직 신청한 회차가 없어요</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#808080]">관심사가 비슷한 친구와 축제를 함께 즐겨보세요</p>
            {offerApplication && <button type="button" disabled={!joinEnabled || loggingOut} onClick={() => void join()} className={`${profileButton} mt-4 bg-[#1554ff] text-white`}>인스타팅 신청하기<ProfileChevron /></button>}
          </div>}
          {currentApplied && !cards.some(card => card.participation.roundSeq === currentRound?.seq) && <p className="rounded-lg bg-[#eff3ff] p-4 text-xs text-[#808080]" role="status">신청 내역을 확인하고 있어요.<button type="button" className="ml-2 text-[#1554ff] underline" onClick={() => void onChanged()}>다시 확인</button></p>}
          {cards.length > 0 && offerApplication && <article className="rounded-[8px] border border-[#d5dfff] p-4" aria-label={`${currentRound.seq}차 신청 안내`}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium"><div className="flex items-center gap-1.5"><span className="rounded-[4px] bg-[#1554ff] px-2 py-1 font-bold text-white">{currentRound.seq}차</span><span className="rounded-[4px] bg-[#eff3ff] px-2 py-1 text-[#1554ff]">{currentRound.status === 'SCHEDULED' ? '접수 예정' : roundOpen ? '접수 중' : '접수 마감'}</span></div><span className="text-[#808080]">{matchClock(currentRound.closeAt)} 마감</span></div>
            <h3 className="mt-3 text-base font-bold tracking-[-0.5px]">{roundOpen ? `${currentRound.seq}차에도 참여할 수 있어요` : currentRound.status === 'SCHEDULED' ? `${currentRound.seq}차 접수를 기다려주세요` : `${currentRound.seq}차 접수가 마감됐어요`}</h3>
            {previousMatched && <p className="mt-3 text-xs leading-relaxed text-[#808080]">이전 신청 정보로 간편하게 다시 참여해보세요</p>}
            <ProfileSchedule round={currentRound} now={serverNow} applied={false} />
            <button type="button" disabled={!joinEnabled || loggingOut} onClick={() => void join()} className={`${profileButton} mt-3 bg-[#1554ff] text-white`}>{busy ? '신청 중…' : `${currentRound.seq}차 신청하기`}<ProfileChevron /></button>
            {previousMatched && accepting && !checkingRejoin && !canRejoin && <p className="mt-2 text-xs text-[#808080]">현재 재참여할 수 없어요. 신청 상태를 다시 확인해 주세요.</p>}
          </article>}
        </div>
        {!isPreview && lastRoundSeq !== undefined && <ResourceStatus loading={history.loading} error={history.error} retry={history.refresh} />}
        {!isPreview && currentRound && !cards.length && !finished && <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-[#808080]"><ClockIcon /><span>{currentRound.seq}차 {currentRound.status === 'SCHEDULED' ? '접수 예정' : roundOpen ? '접수 중' : '접수 마감'} · {matchClock(currentRound.closeAt)} 마감 · {matchClock(currentRound.publishAt)} 발표</span></p>}
        {!isPreview && cards.length > 0 && matchSummary?.nextRound && <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[#808080]"><ClockIcon /><span>{matchSummary.nextRound.seq}차 접수는 {matchClock(matchSummary.nextRound.openAt)}에 열려요</span></p>}
        {!isPreview && finished && <p className="mt-3 rounded-lg bg-[#f6f6f6] px-3 py-3 text-xs leading-relaxed text-[#808080]">이번 인스타팅은 끝났어요. 신청 정보와 인스타 아이디는 축제 종료 7일 뒤 삭제돼요.</p>}
        {cancelVisible && <div className="mt-4 rounded-lg border border-[#d5dfff] p-4" role="group" aria-label="신청 취소 확인"><p className="text-sm">{cancelTarget.roundSeq}차 신청을 취소할까요?</p><div className="mt-3 flex gap-2"><button type="button" disabled={busy || !canManage} className="min-h-11 rounded-lg bg-[#1554ff] px-5 text-sm text-white disabled:opacity-40" onClick={() => void confirmCancel()}>{busy ? '처리 중…' : '신청 취소 확인'}</button><button type="button" disabled={busy} className="min-h-11 rounded-lg border border-[#d5dfff] px-5 text-sm" onClick={() => setCancelTarget(null)}>돌아가기</button></div></div>}
        {notice && <p role="status" className="mt-3 text-sm text-[#1554ff]">{notice}</p>}
        {actionError && <p role="alert" className="mt-3 text-sm text-red-700">{actionError}</p>}
      </section>

      <section className="mt-7" aria-labelledby="profile-settings-title">
        <p className="text-xs text-[#808080]">알림과 계정</p><h2 id="profile-settings-title" className="mt-1 text-lg font-bold">설정</h2>
        <div className="mt-5 overflow-hidden rounded-[8px] border border-[#d5dfff]">
          {!isPreview && <NoticeNotificationActions compact />}
          {onLogout && <button type="button" disabled={loggingOut || busy} onClick={() => void signOut()} className="flex min-h-12 w-full cursor-pointer items-center justify-between border-t border-[#d5dfff] px-4 text-left text-sm text-[#808080] disabled:cursor-default disabled:opacity-50">{loggingOut ? '로그아웃 중…' : '로그아웃'}<ProfileChevron /></button>}
          {isPreview && <p className="px-4 py-4 text-xs text-[#808080]">로그인 후 알림과 계정을 관리할 수 있어요.</p>}
        </div>
        {logoutError && <p className="mt-2 text-xs text-red-700" role="alert">{logoutError}</p>}
      </section>
    </div>
  </AppLayout>
}

function ClockIcon() {
  return <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 6v6l3 2" /></svg>
}
