import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { buildProfileRoundCards, closeTimeRemaining, getProfileResultHistory, matchClock, profileServerNow, publicationMessage, resolveResultParticipation } from '../src/utils/profileHistory.ts'
import { profileFromSession } from '../src/utils/profile.ts'
import { parseMatchTime } from '../src/utils/match.ts'
import { toMatchResult } from '../src/utils/matchResult.ts'
import type { MatchApplication, MatchSummary, MyMatchResult } from '../src/api/match.ts'

const auth = { role: 'USER' as const, displayName: '승래', profileImageUrl: null }
const application: MatchApplication = { id: 22, roundSeq: 2, instagramId: 'test', nickname: '승래', gender: 'M', ageBand: '22-24', tags: ['MUSIC'], intro: null, wantedSlot: null, needsSlotReselect: false, entryType: 'REJOIN', createdAt: '2026-10-02T16:10:00' }
const summary: MatchSummary = { serverNow: '2026-10-02T18:30:00', currentRound: { seq: 2, status: 'OPEN', openAt: '2026-10-02T16:00:00', closeAt: '2026-10-02T19:50:00', publishAt: '2026-10-02T20:00:00' }, nextRound: null, applicantCount: 20, my: { applied: true, lastResult: { roundSeq: 1, status: 'MATCHED' } } }
function result(roundSeq: number, status: 'MATCHED' | 'UNMATCHED' = 'MATCHED'): MyMatchResult {
  return { roundSeq, status, partners: [], nextRoundSeq: roundSeq === 1 ? 2 : null, canRejoin: false, hasNextRoundApplication: roundSeq === 1 }
}
const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test('이전 결과를 위에, 현재 신청을 아래에 표시하며 신청 상세를 다른 회차에 붙이지 않는다', () => {
  const user = profileFromSession(auth, application, summary)
  const cards = buildProfileRoundCards(user.participations, application, summary, [toMatchResult(result(1))])
  assert.deepEqual(cards.map(card => card.participation.roundSeq), [1, 2])
  assert.equal(cards[0].status, 'matched')
  assert.equal(cards[0].highlighted, true)
  assert.equal(cards[0].application, undefined)
  assert.equal(cards[0].round, undefined)
  assert.equal(cards[1].status, 'pending')
  assert.equal(cards[1].application?.id, 22)
  assert.equal(cards[1].round?.publishAt, summary.currentRound.publishAt)
})

test('두 회차 발표가 끝나면 실제 참여한 두 결과를 유지하고 최신 성공 카드만 강조한다', () => {
  const finalSummary: MatchSummary = { ...summary, currentRound: { ...summary.currentRound, status: 'PUBLISHED' }, my: { applied: true, lastResult: { roundSeq: 2, status: 'MATCHED' } } }
  const user = profileFromSession(auth, application, finalSummary)
  const cards = buildProfileRoundCards(user.participations, application, finalSummary, [toMatchResult(result(1)), toMatchResult(result(2))])
  assert.deepEqual(cards.map(card => [card.participation.roundSeq, card.status, card.highlighted]), [[1, 'matched', false], [2, 'matched', true]])
  assert.equal(resolveResultParticipation(user.participations, cards[0].participation.id)?.roundSeq, 1)
  assert.equal(resolveResultParticipation(user.participations, 'result-round-0'), undefined)
  assert.equal(resolveResultParticipation(user.participations, 'not-a-result'), undefined)
})

test('미매칭과 자동 이월을 구분하고 결과 상세를 아직 못 받아도 서버 요약의 상태를 사용한다', () => {
  const carried = { ...application, entryType: 'CARRIED' as const }
  const state: MatchSummary = { ...summary, my: { applied: true, lastResult: { roundSeq: 1, status: 'UNMATCHED' } } }
  const cards = buildProfileRoundCards(profileFromSession(auth, carried, state).participations, carried, state, [])
  assert.equal(cards[0].status, 'unmatched')
  assert.equal(cards[0].highlighted, false)
  assert.equal(cards[1].application?.entryType, 'CARRIED')
  assert.equal(cards[1].status, 'pending')
})

test('발표 예정 시간이 지나도 서버가 발표하지 않은 신청을 결과 카드로 바꾸지 않는다', () => {
  const beforePublish: MatchSummary = { ...summary, serverNow: '2026-10-02T20:01:00', currentRound: { ...summary.currentRound, status: 'CLOSED' }, my: { applied: true, lastResult: null } }
  const cards = buildProfileRoundCards(profileFromSession(auth, application, beforePublish).participations, application, beforePublish, [])
  assert.equal(cards[0].status, 'pending')
  assert.equal(publicationMessage(beforePublish.currentRound.publishAt, parseMatchTime(beforePublish.serverNow)), '결과 발표를 준비하고 있어요')
})

test('카드 시각·마감 카운트다운은 서버 시각과 수신 후 경과 시간으로 계산한다', () => {
  const start = profileServerNow(summary, 1000, 1000)
  assert.equal(start, parseMatchTime(summary.serverNow))
  assert.equal(closeTimeRemaining(summary.currentRound.closeAt, start), '1시간 20분 남음')
  assert.equal(closeTimeRemaining(summary.currentRound.closeAt, profileServerNow(summary, 1000, 4_801_000)), '접수 마감')
  assert.equal(closeTimeRemaining(summary.currentRound.closeAt, parseMatchTime('2026-10-02T19:49:59')), '1분 미만 남음')
  assert.equal(matchClock('2026-10-02T11:00:00Z'), '20:00')
  assert.equal(publicationMessage(summary.currentRound.publishAt, start), '결과는 오늘 20:00에 열려요')
  assert.match(publicationMessage(summary.currentRound.publishAt, parseMatchTime('2026-10-01T18:00:00')), /10월 2일/)
})

test('결과 이력 조회는 미참여 회차만 제외하고 실제 회차 번호를 검증한다', async () => {
  const calls: number[] = []
  globalThis.fetch = (async input => {
    const seq = Number(new URL(String(input)).searchParams.get('roundSeq'))
    calls.push(seq)
    return seq === 1 ? Response.json({ code: 'APPLICATION_NOT_FOUND' }, { status: 404 }) : Response.json({ data: result(2) })
  }) as typeof fetch
  assert.deepEqual((await getProfileResultHistory(2)).map(item => item.roundSeq), [2])
  assert.deepEqual(calls, [1, 2])
  globalThis.fetch = (async () => Response.json({ data: result(2) })) as typeof fetch
  await assert.rejects(() => getProfileResultHistory(1), /회차/)
})

test('결과 조회의 인증·서버 오류를 미참여로 숨기거나 가짜 결과를 만들지 않는다', async () => {
  for (const status of [401, 403, 500]) {
    globalThis.fetch = (async () => new Response(null, { status })) as typeof fetch
    await assert.rejects(() => getProfileResultHistory(2))
  }
  let calls = 0
  globalThis.fetch = (async () => { calls++; return Response.json({ data: result(1) }) }) as typeof fetch
  assert.deepEqual(await getProfileResultHistory(), [])
  await assert.rejects(() => getProfileResultHistory(-1))
  await assert.rejects(() => getProfileResultHistory(100000))
  assert.equal(calls, 0)
})
