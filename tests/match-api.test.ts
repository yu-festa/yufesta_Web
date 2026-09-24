import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { cancelMyApplication, createMatchApplication, getMyApplication, getMyMatchResults, rejoinMatch, reportMatch } from '../src/api/match.ts'
import type { MatchSummary, MatchTagOption } from '../src/api/match.ts'
import { ApiError } from '../src/api/client.ts'
import { isMatchOpen, parseMatchTime, toMatchApplicationRequest } from '../src/utils/match.ts'
import { toMatchResult } from '../src/utils/matchResult.ts'
import { profileFromApplication } from '../src/utils/profile.ts'

const originalFetch = globalThis.fetch
const originalDocument = globalThis.document
afterEach(() => {
  globalThis.fetch = originalFetch
  Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true, writable: true })
})
const options: MatchTagOption[] = [{ code: 'MUSIC', label: '음악' }, { code: 'CAFE', label: '카페' }]
const form = { nickname: ' 펭귄 ', instagram: '@Yu.Festa', gender: '여', age: '22 - 24세', tags: ['MUSIC', 'CAFE'], introduction: ' 같이 공연 봐요 ', performance: '', multipleMatches: false }
const summary: MatchSummary = {
  serverNow: '2026-10-02T15:30:00', currentRound: { seq: 2, status: 'OPEN', openAt: '2026-10-02T14:00:00', closeAt: '2026-10-02T15:50:00', publishAt: '2026-10-02T16:00:00' },
  nextRound: null, applicantCount: 100, my: { applied: false, lastResult: { roundSeq: 1, status: 'MATCHED' } },
}

test('신청 정보를 정규화하고 태그 코드·세 가지 동의만 명세 필드로 전송한다', () => {
  assert.deepEqual(toMatchApplicationRequest(form, options, [true, true, true]), {
    nickname: '펭귄', instagramId: 'yu.festa', gender: 'F', ageBand: '22-24', tags: ['MUSIC', 'CAFE'], intro: '같이 공연 봐요', termsVersion: '2026-09-01', privacyVersion: '2026-09-01', ageConfirmed: true,
  })
  assert.equal(toMatchApplicationRequest({ ...form, age: '19 - 21세' }, options, [true, true, true]).ageBand, '19-21')
  assert.throws(() => toMatchApplicationRequest(form, options, [true, false, true]), /동의/)
  for (const tags of [[], ['음악'], ['MUSIC', 'MUSIC'], ['MUSIC', 'CAFE', 'MUSIC', 'CAFE']]) assert.throws(() => toMatchApplicationRequest({ ...form, tags }, options, [true, true, true]), /태그/)
})

test('신청 가능 시간은 기기 시계 오차 대신 수신한 서버 시각과 경과 시간으로 판단한다', () => {
  assert.equal(parseMatchTime('2026-10-02T15:30:00'), Date.parse('2026-10-02T06:30:00Z'))
  assert.equal(isMatchOpen(summary, 1000, 1000), true)
  assert.equal(isMatchOpen(summary, 1000, 1000 + 20 * 60 * 1000), false)
  assert.equal(isMatchOpen({ ...summary, currentRound: { ...summary.currentRound, status: 'CLOSED' } }, 0, 0), false)
  assert.equal(isMatchOpen(null, 0, 0), false)
})

test('신청→조회→취소→재참여를 인증·CSRF와 함께 처리하고 빈 성공 응답을 허용한다', async () => {
  const doc = { cookie: '' }
  Object.defineProperty(globalThis, 'document', { value: doc, configurable: true, writable: true })
  const calls: string[] = []
  let applied = false
  globalThis.fetch = (async (input, init) => {
    const path = new URL(String(input)).pathname
    calls.push(`${init?.method ?? 'GET'} ${path}`)
    assert.equal(init?.credentials, 'include')
    if (path.endsWith('/csrf')) { doc.cookie = 'XSRF-TOKEN=match-test'; return new Response(null, { status: 204 }) }
    if (init?.method !== 'GET') assert.equal(new Headers(init?.headers).get('X-XSRF-TOKEN'), 'match-test')
    if (init?.method === 'GET') return applied ? Response.json({ data: { id: 4, roundSeq: 2 } }) : Response.json({ status: 404, code: 'APPLICATION_NOT_FOUND', message: '없음', errors: [] }, { status: 404 })
    if (path.endsWith('/applications')) {
      const body = JSON.parse(String(init?.body))
      assert.equal(body.instagramId, 'yu.festa')
      assert.deepEqual(body.tags, ['MUSIC', 'CAFE'])
      applied = true
    } else if (path.endsWith('/rejoin')) { applied = true; assert.equal(init?.body, undefined) }
    else if (init?.method === 'DELETE') applied = false
    return new Response(null, { status: applied ? 200 : 204 })
  }) as typeof fetch
  await createMatchApplication(toMatchApplicationRequest(form, options, [true, true, true]))
  assert.equal((await getMyApplication()).roundSeq, 2)
  await cancelMyApplication()
  await assert.rejects(getMyApplication, (error: unknown) => error instanceof ApiError && error.status === 404)
  await rejoinMatch()
  assert.equal((await getMyApplication()).id, 4)
  assert.equal(calls.filter(call => call.endsWith('/csrf')).length, 1)
  assert.ok(calls.includes('DELETE /api/v1/match/applications/me'))
  assert.ok(calls.includes('POST /api/v1/match/applications/rejoin'))
})

test('결과의 회차 선택과 신고 본문을 전달하고 발표 전 409와 필드 오류를 보존한다', async () => {
  Object.defineProperty(globalThis, 'document', { value: { cookie: 'XSRF-TOKEN=token' }, configurable: true, writable: true })
  globalThis.fetch = (async (input, init) => {
    if (String(input).endsWith('/reports')) {
      assert.deepEqual(JSON.parse(String(init?.body)), { matchId: 77, reason: 'FAKE', detail: '프로필 정보가 달라요' })
      return new Response(null, { status: 204 })
    }
    assert.ok(String(input).endsWith('/results/me?roundSeq=2'))
    return Response.json({ status: 409, code: 'NOT_PUBLISHED', message: '발표 전', errors: [{ field: 'roundSeq', message: '발표 전 회차' }] }, { status: 409 })
  }) as typeof fetch
  await assert.rejects(() => getMyMatchResults(2), (error: unknown) => error instanceof ApiError && error.status === 409 && error.errors[0].message === '발표 전 회차')
  await reportMatch({ matchId: 77, reason: 'FAKE', detail: '프로필 정보가 달라요' })
})

test('임시 결과 계약은 카드 순서를 보존하고 빈 카드와 미매칭을 구분한다', () => {
  const result = toMatchResult({ roundSeq: 1, status: 'MATCHED', cards: [{ matchId: 77, nickname: '친구', instagramId: '@friend' }, { matchId: 78, nickname: '친구2', instagramId: 'friend2' }] })
  assert.deepEqual(result.result, { status: 'matched', partners: [{ matchId: 77, nickname: '친구', instagram: 'friend' }, { matchId: 78, nickname: '친구2', instagram: 'friend2' }] })
  assert.deepEqual(toMatchResult({ roundSeq: 1, status: 'MATCHED', cards: [] }).result, { status: 'matched', partners: [] })
  assert.deepEqual(toMatchResult({ roundSeq: 1, status: 'UNMATCHED' }).result, { status: 'unmatched' })
  for (const data of [null, {}, { roundSeq: 1, status: 'MATCHED' }, { roundSeq: 1, status: 'MATCHED', cards: [{ matchId: 1, nickname: '친구', instagramId: 'javascript:alert(1)' }] }]) assert.throws(() => toMatchResult(data), /형식/)
})

test('현재 신청이 없어도 최근 발표 회차를 프로필에서 열 수 있다', () => {
  const profile = profileFromApplication(null, summary)
  assert.equal(profile.participations[0].roundSeq, 1)
  assert.equal(profile.participations[0].published, true)
  assert.equal(profile.participations[0].resultOnly, true)
})
