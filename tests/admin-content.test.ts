import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import * as content from '../src/api/adminContent.ts'

const originalFetch = globalThis.fetch
const originalDocument = globalThis.document
afterEach(() => {
  globalThis.fetch = originalFetch
  Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true, writable: true })
})

test('새 운영 API의 경로·메서드·본문과 CSRF 계약을 지킨다', async () => {
  Object.defineProperty(globalThis, 'document', { value: { cookie: 'XSRF-TOKEN=admin-token' }, configurable: true, writable: true })
  const calls: { method: string; path: string; body: unknown }[] = []
  globalThis.fetch = (async (input, init) => {
    const method = init?.method ?? 'GET'
    assert.equal(init?.credentials, 'include')
    if (method !== 'GET') assert.equal(new Headers(init?.headers).get('X-XSRF-TOKEN'), 'admin-token')
    const url = new URL(String(input))
    calls.push({ method, path: url.pathname + url.search, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    return method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json({ data: [] })
  }) as typeof fetch
  const slot = { title: '공연', slotType: 'CLUB' as const, startAt: '2026-10-02T16:00:00', endAt: '2026-10-02T16:30:00', stagePlaceId: 1, clubId: null, sortOrder: 2 }
  const club = { name: '동아리', intro: '소개', genre: null, signatureSong: null, instagramUrl: null, photoUrl: null, sortOrder: 1 }
  await content.getAdminTimetable()
  await content.createTimetableSlot(slot)
  await content.updateTimetableSlot(4, { title: slot.title, slotType: slot.slotType, stagePlaceId: 1, clubId: null })
  await content.changeTimetableSlotTimes(4, slot.startAt, slot.endAt)
  await content.setTimetableSlotLive(4, true)
  await content.setTimetableSlotDelay(4, 10)
  await content.reorderTimetableSlots([4, 3])
  await content.deleteTimetableSlot(4)
  await content.getAdminClubs()
  await content.createAdminClub(club)
  await content.updateAdminClub(3, club)
  await content.deleteAdminClub(3)
  await content.createOfficialLostItem({ description: '지갑', placeText: '도서관', occurredAt: null })
  await content.setLostItemVisibility(7, true)
  await content.resolveAdminLostItem(7)
  await content.setCheerVisibility(11, false)
  await content.getAdminContentReports(false, 'LOST_ITEM', 2)
  await content.reviewContentReport(9)
  assert.deepEqual(calls.map(call => `${call.method} ${call.path}`), [
    'GET /api/v1/admin/timetable', 'POST /api/v1/admin/timetable', 'PATCH /api/v1/admin/timetable/4', 'PATCH /api/v1/admin/timetable/4/times', 'PATCH /api/v1/admin/timetable/4/live', 'PATCH /api/v1/admin/timetable/4/delay', 'PUT /api/v1/admin/timetable/order', 'DELETE /api/v1/admin/timetable/4',
    'GET /api/v1/admin/clubs', 'POST /api/v1/admin/clubs', 'PATCH /api/v1/admin/clubs/3', 'DELETE /api/v1/admin/clubs/3',
    'POST /api/v1/admin/lost-items', 'PATCH /api/v1/admin/lost-items/7/visibility', 'PATCH /api/v1/admin/lost-items/7/resolve', 'PATCH /api/v1/admin/cheers/11/visibility',
    'GET /api/v1/admin/content-reports?page=2&size=20&reviewed=false&targetType=LOST_ITEM', 'PATCH /api/v1/admin/content-reports/9/review',
  ])
  assert.deepEqual(calls[1].body, slot)
  assert.deepEqual(calls[6].body, { slotIds: [4, 3] })
  assert.deepEqual(calls[13].body, { hidden: true })
  assert.equal(calls[17].body, undefined)
})
