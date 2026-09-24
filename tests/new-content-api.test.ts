import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { getTimetable } from '../src/api/timetable.ts'
import { getClubs, getClub } from '../src/api/clubs.ts'
import { getLostItems, createLostItem, resolveLostItem, deleteLostItem } from '../src/api/lostItems.ts'
import { createContentReport } from '../src/api/contentReports.ts'
import { getMatchSlots } from '../src/api/match.ts'

const originalFetch = globalThis.fetch
const originalDocument = globalThis.document
afterEach(() => {
  globalThis.fetch = originalFetch
  Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true, writable: true })
})

test('공개 일정·동아리·공연 선택지·분실물 조회 응답을 각 화면의 데이터로 받는다', async () => {
  const calls: string[] = []
  globalThis.fetch = (async (input, init) => {
    const url = new URL(String(input))
    assert.equal(init?.credentials, 'include')
    calls.push(url.pathname + url.search)
    if (url.pathname.endsWith('/timetable')) return Response.json({ data: { serverNow: '2026-10-02T15:00:00', slots: [{ id: 9, title: '공연', effectiveStartAt: '2026-10-02T16:00:00' }] } })
    if (url.pathname.endsWith('/match/slots')) return Response.json({ data: { roundSeq: 2, publishAt: '2026-10-02T16:00:00', slots: [{ id: 9, title: '공연' }] } })
    if (url.pathname.endsWith('/clubs/3')) return Response.json({ data: { id: 3, name: '동아리', performances: [] } })
    if (url.pathname.endsWith('/clubs')) return Response.json({ data: [{ id: 3, name: '동아리', performances: [] }] })
    return Response.json({ data: [{ id: 7, kind: 'LOST', description: '지갑' }] })
  }) as typeof fetch
  assert.equal((await getTimetable()).slots[0].id, 9)
  assert.equal((await getMatchSlots()).slots[0].id, 9)
  assert.equal((await getClubs())[0].id, 3)
  assert.equal((await getClub(3)).name, '동아리')
  assert.equal((await getLostItems())[0].id, 7)
  assert.deepEqual(calls, ['/api/v1/timetable', '/api/v1/match/slots', '/api/v1/clubs', '/api/v1/clubs/3', '/api/v1/lost-items?size=50'])
})

test('분실물 등록·해결·삭제와 응원/분실물 신고에 인증 쿠키·CSRF를 전송한다', async () => {
  Object.defineProperty(globalThis, 'document', { value: { cookie: 'XSRF-TOKEN=content-token' }, configurable: true, writable: true })
  const calls: { path: string; method: string; body: unknown }[] = []
  globalThis.fetch = (async (input, init) => {
    assert.equal(init?.credentials, 'include')
    assert.equal(new Headers(init?.headers).get('X-XSRF-TOKEN'), 'content-token')
    calls.push({ path: new URL(String(input)).pathname, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined })
    return init?.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json({ data: { id: 7 } })
  }) as typeof fetch
  await createLostItem({ kind: 'LOST', description: '검은 지갑', placeText: '중앙 무대', occurredAt: null })
  await resolveLostItem(7)
  await deleteLostItem(7)
  await createContentReport('CHEER', 11, '욕설')
  await createContentReport('LOST_ITEM', 7, '허위 글')
  assert.deepEqual(calls.map(call => `${call.method} ${call.path}`), ['POST /api/v1/lost-items', 'PATCH /api/v1/lost-items/7/resolve', 'DELETE /api/v1/lost-items/7', 'POST /api/v1/content-reports', 'POST /api/v1/content-reports'])
  assert.deepEqual(calls[0].body, { kind: 'LOST', description: '검은 지갑', placeText: '중앙 무대', occurredAt: null })
  assert.deepEqual(calls[3].body, { targetType: 'CHEER', targetId: 11, reason: '욕설' })
  assert.deepEqual(calls[4].body, { targetType: 'LOST_ITEM', targetId: 7, reason: '허위 글' })
  assert.throws(() => createContentReport('CHEER', 11, ' '), /신고 사유/)
})
