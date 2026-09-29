import { useState } from 'react'
import type { MatchApplication, MatchRound } from '../api/match'
import type { ProfileRoundCard } from '../utils/profileHistory'
import { closeTimeRemaining, matchClock, publicationMessage } from '../utils/profileHistory'
import { matchTagLabels } from '../utils/profile'

export const profileButton = 'flex min-h-11 w-full items-center justify-center gap-2 rounded-[7px] px-3 py-2.5 text-sm font-semibold cursor-pointer disabled:cursor-default disabled:opacity-40'

export function ProfileChevron({ down = false }: { down?: boolean }) {
  return <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={down ? 'm6 9 6 6 6-6' : 'm9 5 7 7-7 7'} /></svg>
}

export function ProfileSchedule({ round, now, applied }: { round: MatchRound; now: number; applied: boolean }) {
  return <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-[8px] bg-[#eff3ff] px-3 py-3 text-[#171717]">
    <div className="min-w-0"><p className="text-[10px] text-[#808080]">{applied ? '수정·취소 마감' : '신청 마감'}</p><div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-1"><time className="text-base leading-none font-bold" dateTime={round.closeAt}>{matchClock(round.closeAt)}</time><span className="text-[11px] leading-none font-medium text-[#1554ff]" role="timer" aria-live="off">{round.status === 'CLOSED' || round.status === 'PUBLISHED' ? '접수 마감' : closeTimeRemaining(round.closeAt, now)}</span></div></div>
    <div className="border-l border-[#d1ddff] pl-3"><p className="text-[10px] text-[#808080]">결과 발표</p><time className="mt-1 block text-base leading-none font-bold" dateTime={round.publishAt}>{matchClock(round.publishAt)}</time></div>
  </div>
}

function ApplicationDetails({ application, highlighted }: { application: MatchApplication; highlighted: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const fields = [
    ['인스타 아이디', `@${application.instagramId}`],
    ['닉네임', application.nickname],
    ['성별 · 나이대', `${application.gender === 'M' ? '남' : '여'} · ${application.ageBand === '28+' ? '28세 이상' : application.ageBand ?? '선택 안 함'}`],
    ['관심 태그', application.tags.map(tag => matchTagLabels[tag]).join(' · ') || '선택 안 함'],
    ['보고 싶은 공연', application.wantedSlot ? `${application.wantedSlot.title} · ${application.wantedSlot.stageName}` : '선택 안 함'],
    ...(application.intro ? [['한 줄 소개', application.intro]] : []),
  ]
  return <details onToggle={event => setExpanded(event.currentTarget.open)} className={`mt-3 ${highlighted ? 'border-t border-white/25 pt-2' : ''}`}>
    <summary className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-xs [&::-webkit-details-marker]:hidden ${highlighted ? 'text-white/80' : 'text-[#808080]'}`}>내가 낸 신청 정보 {expanded ? '접기' : '보기'}<span className={expanded ? 'rotate-180' : ''}><ProfileChevron down /></span></summary>
    <dl className="mt-1 space-y-2 rounded-[8px] bg-[#eff3ff] px-3 py-3 text-[11px] leading-relaxed">{fields.map(([label, value]) => <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-2" key={label}><dt className="text-[#808080]">{label}</dt><dd className="text-right font-semibold whitespace-pre-wrap wrap-anywhere text-[#171717]">{value}</dd></div>)}</dl>
  </details>
}

export default function ProfileMatchCard({ card, now, canManage, busy, onEdit, onCancel, onResult }: { card: ProfileRoundCard; now: number; canManage: boolean; busy: boolean; onEdit: () => void; onCancel: () => void; onResult: () => void }) {
  const { participation, round, application, status, highlighted } = card
  const published = status !== 'pending'
  const carried = !published && application?.entryType === 'CARRIED'
  const badge = participation.isDemo ? '결과 미리보기' : published ? highlighted ? '결과 도착' : '발표 완료' : carried ? '자동 신청됨' : '신청 완료'
  return <article aria-label={`${participation.round} ${badge}`} className={`rounded-[8px] border p-4 ${highlighted ? 'border-[#1554ff] bg-[#1554ff] text-white' : 'border-[#d5dfff] bg-white text-[#171717]'}`}>
    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium">
      <div className="flex items-center gap-1.5"><span className={`rounded-[4px] px-2 py-1 font-bold ${highlighted ? 'bg-white text-[#1554ff]' : 'bg-[#1554ff] text-white'}`}>{participation.round}</span><span className={`rounded-[4px] px-2 py-1 ${highlighted ? 'bg-white/25 text-white' : 'bg-[#eff3ff] text-[#1554ff]'}`}>{badge}</span></div>
      <span className={highlighted ? 'text-white/75' : 'text-[#808080]'}>{published ? `${round ? `${matchClock(round.publishAt)} ` : ''}발표 완료` : '아직 발표 전'}</span>
    </div>
    <h3 className="mt-3 text-base leading-snug font-bold tracking-[-0.5px]">{status === 'matched' ? <><span className="mr-2 text-[#ff6c9c]" aria-hidden="true">♥</span>매칭 성공</> : status === 'unmatched' ? '이번엔 아쉽게 못 만났어요' : status === 'published' ? '매칭 결과가 도착했어요' : round ? publicationMessage(round.publishAt, now) : '결과 발표를 기다리고 있어요'}</h3>
    {status === 'unmatched' && <p className="mt-3 text-xs leading-relaxed text-[#808080]">이번 회차에는 매칭이 성사되지 않았어요.</p>}
    {carried && <p className="mt-3 text-xs leading-relaxed text-[#808080]">이전 회차에서 만나지 못해 같은 내용으로 자동 신청됐어요</p>}
    {published ? <button type="button" className={`${profileButton} mt-3 ${highlighted ? 'bg-white text-[#1554ff]' : 'border border-[#d5dfff] text-[#1554ff]'}`} onClick={onResult}>{participation.isDemo ? '결과 카드 체험하기' : status === 'unmatched' ? `${participation.round} 결과 화면 보기` : highlighted ? '결과 보러 가기' : '결과 다시 보기'}{highlighted && <ProfileChevron />}</button> : <>
      {round && <ProfileSchedule round={round} now={now} applied />}
      {application?.needsSlotReselect && <p className="mt-3 rounded-lg bg-[#eff3ff] px-3 py-2 text-xs leading-relaxed text-[#1554ff]">이전 공연을 현재 회차에서 사용할 수 없어요. 신청 정보를 수정해 공연을 다시 선택해 주세요.</p>}
      {canManage && <button type="button" disabled={busy} className={`${profileButton} mt-3 border border-[#d5dfff] text-[#1554ff]`} onClick={onEdit}>신청 정보 수정하기</button>}
      {round && !canManage && !busy && (round.status === 'CLOSED' || closeTimeRemaining(round.closeAt, now) === '접수 마감') && <p className="mt-2 text-[11px] text-[#808080]">접수가 마감되어 수정·취소할 수 없어요.</p>}
    </>}
    {application && <ApplicationDetails application={application} highlighted={highlighted} />}
    {!published && application && canManage && <button type="button" disabled={busy} className="mx-auto mt-2 block min-h-9 cursor-pointer px-3 text-xs text-[#fa6581] underline underline-offset-2 disabled:cursor-default disabled:opacity-40" onClick={onCancel}>신청 취소하기</button>}
  </article>
}
