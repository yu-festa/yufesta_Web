import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import * as admin from '../src/api/admin.ts'
import { ApiError } from '../src/api/client.ts'
import { isAdminRole, loginDestination, roundActions, toKoreanInput, validateRoundTimes } from '../src/utils/admin.ts'

const originalFetch = globalThis.fetch
const originalDocument = globalThis.document
afterEach(() => {
  globalThis.fetch = originalFetch
  Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true, writable: true })
})
const times = { openAt: '2026-10-02T10:00:00', closeAt: '2026-10-02T10:01:00', publishAt: '2026-10-02T10:11:00' }
const round: admin.AdminRound = { ...times, id: 17, seq: 1, status: 'SCHEDULED', executedAt: null, publishedAt: null }

test('서버 역할로만 운영자 진입을 허용하고 로그인 목적지를 결정한다', () => {
  assert.equal(loginDestination('STAFF'), '/admin')
  assert.equal(loginDestination('OWNER'), '/admin')
  assert.equal(loginDestination('USER'), '/main')
  assert.equal(loginDestination(null), '/main')
  for (const role of [undefined, null, '', 'ADMIN', 'ROLE_OWNER', 'owner', { role: 'OWNER' }]) assert.equal(isAdminRole(role), false)
})

test('회차 상태와 권한을 함께 검사하고 발표 후 수정과 재실행을 막는다', () => {
  assert.equal(roundActions(round, 'STAFF').open, true)
  assert.equal(roundActions(round, 'USER').open, false)
  assert.equal(roundActions({ ...round, status: 'OPEN' }, 'STAFF').close, true)
  const closed = { ...round, status: 'CLOSED' as const }
  assert.equal(roundActions(closed, 'STAFF').rerun, true)
  assert.equal(roundActions(closed, 'STAFF').publish, false)
  assert.equal(roundActions(closed, 'OWNER').publish, true)
  for (const published of [{ ...round, status: 'PUBLISHED' as const }, { ...closed, publishedAt: times.publishAt }]) {
    assert.deepEqual(Object.values(roundActions(published, 'OWNER')), [false, false, false, false, false])
  }
})

test('한국 시간으로 편집하고 마감과 발표의 정확한 10분 간격을 검증한다', () => {
  assert.equal(toKoreanInput('2026-10-02T01:00:00.000Z'), '2026-10-02T10:00:00')
  assert.equal(toKoreanInput('2026-10-02T10:00:00+09:00'), '2026-10-02T10:00:00')
  assert.equal(toKoreanInput(times.openAt), times.openAt)
  assert.equal(toKoreanInput('invalid'), '')
  assert.equal(validateRoundTimes(times), '')
  assert.match(validateRoundTimes({ ...times, openAt: times.closeAt }), /시작/)
  assert.match(validateRoundTimes({ ...times, publishAt: '2026-10-02T10:10:59' }), /10분/)
  assert.match(validateRoundTimes({ ...times, openAt: '' }), /올바르게/)
})

test('회차 조회와 모든 상태 변경은 seq가 아닌 id로 요청하며 CSRF를 포함한다', async () => {
  const calls: { method: string; path: string; body: unknown }[] = []
  Object.defineProperty(globalThis, 'document', { value: { cookie: 'XSRF-TOKEN=admin-token' }, configurable: true, writable: true })
  globalThis.fetch = (async (input, init) => {
    const path = new URL(String(input)).pathname
    assert.equal(init?.credentials, 'include')
    if (init?.method !== 'GET') assert.equal(new Headers(init?.headers).get('X-XSRF-TOKEN'), 'admin-token')
    calls.push({ method: init?.method ?? 'GET', path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    return Response.json({ data: round })
  }) as typeof fetch
  await admin.getAdminRounds()
  await admin.getBatchResult(17)
  await admin.openRound(17)
  await admin.closeRound(17)
  await admin.rerunRound(17)
  await admin.publishRound(17)
  await admin.updateRoundTimes(17, times)
  assert.deepEqual(calls.map(c => `${c.method} ${c.path}`), [
    'GET /api/v1/admin/match/rounds', 'GET /api/v1/admin/match/rounds/17/result',
    ...['open', 'close', 'rerun', 'publish'].map(action => `POST /api/v1/admin/match/rounds/17/${action}`),
    'PATCH /api/v1/admin/match/rounds/17/times',
  ])
  assert.deepEqual(calls[6].body, times)
  for (const call of calls.slice(2, 6)) assert.equal(call.body, undefined)
})

test('신고 전체·미검토·검토 완료 필터와 페이지, blockId 검토 계약을 보존한다', async () => {
  Object.defineProperty(globalThis, 'document', { value: { cookie: 'XSRF-TOKEN=token' }, configurable: true, writable: true })
  const calls: { url: URL; init?: RequestInit }[] = []
  globalThis.fetch = (async (input, init) => { calls.push({ url: new URL(String(input)), init }); return Response.json({ data: [] }) }) as typeof fetch
  await admin.getAdminReports(undefined, 2, 20)
  await admin.getAdminReports(false)
  await admin.getAdminReports(true)
  await admin.reviewReport(81, 'CONFIRM')
  await admin.reviewReport(81, 'DISMISS')
  assert.equal(calls[0].url.searchParams.has('reviewed'), false)
  assert.equal(calls[0].url.searchParams.get('page'), '2')
  assert.equal(calls[1].url.searchParams.get('reviewed'), 'false')
  assert.equal(calls[2].url.searchParams.get('reviewed'), 'true')
  for (const [index, decision] of [[3, 'CONFIRM'], [4, 'DISMISS']] as const) {
    assert.equal(calls[index].url.pathname, '/api/v1/admin/match/reports/81/review')
    assert.equal(calls[index].init?.method, 'PATCH')
    assert.deepEqual(JSON.parse(String(calls[index].init?.body)), { decision })
  }
})

test('공지·장소·이벤트 등록 수정 삭제는 명세 경로와 본문을 전송한다', async () => {
  Object.defineProperty(globalThis, 'document', { value: { cookie: 'XSRF-TOKEN=token' }, configurable: true, writable: true })
  const calls: { path: string; method: string; body: unknown }[] = []
  globalThis.fetch = (async (input, init) => {
    const url = new URL(String(input))
    calls.push({ path: url.pathname + url.search, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined })
    return init?.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json({ data: { id: 51 } })
  }) as typeof fetch
  const notice = { title: '축제 안내', body: '안내 본문', banner: true }
  const place: admin.PlaceInput = { name: '무대', category: 'STAGE', latitude: 35.8, longitude: 128.7, description: '', building: '', floor: '', sortOrder: 3, active: false }
  const event = { name: '공연', timeText: '18:00', sortOrder: 2 }
  await admin.getNotices(); await admin.getNotice(51)
  await admin.createNotice(notice); await admin.updateNotice(51, notice); await admin.deleteNotice(51)
  await admin.createPlace(place); await admin.updatePlace(61, place)
  await admin.createPlaceEvent(61, event); await admin.updatePlaceEvent(61, 71, event)
  assert.deepEqual(calls.map(c => `${c.method} ${c.path}`), [
    'GET /api/v1/notices?size=50', 'GET /api/v1/notices/51', 'POST /api/v1/admin/notices', 'PATCH /api/v1/admin/notices/51', 'DELETE /api/v1/admin/notices/51',
    'POST /api/v1/admin/places', 'PATCH /api/v1/admin/places/61', 'POST /api/v1/admin/places/61/events', 'PATCH /api/v1/admin/places/61/events/71',
  ])
  assert.deepEqual(calls[3].body, notice)
  assert.deepEqual(calls[6].body, place)
  assert.deepEqual(calls[8].body, event)
})

test('권한 거부·상태 충돌을 성공으로 취급하거나 자동 재실행하지 않는다', async () => {
  Object.defineProperty(globalThis, 'document', { value: { cookie: 'XSRF-TOKEN=token' }, configurable: true, writable: true })
  for (const status of [401, 403, 409, 500]) {
    let count = 0
    globalThis.fetch = (async () => { count++; return Response.json({ status, code: 'REJECTED', message: '서버에서 거부', errors: [] }, { status }) }) as typeof fetch
    await assert.rejects(() => admin.publishRound(17), (reason: unknown) => reason instanceof ApiError && reason.status === status)
    assert.equal(count, 1)
  }
})
