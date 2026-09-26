import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import * as content from '../src/api/adminContent.ts'
import { MAX_CLUB_PHOTO_BYTES, validateClubPhoto } from '../src/utils/clubPhoto.ts'
import { ApiError } from '../src/api/client.ts'

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
  const club = { name: '동아리', intro: '소개', genre: null, signatureSong: null, instagramUrl: null, sortOrder: 1 }
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
  assert.deepEqual(calls[9].body, club)
  assert.deepEqual(calls[10].body, club)
  assert.equal(Object.hasOwn(calls[10].body as object, 'photoUrl'), false)
  assert.deepEqual(calls[13].body, { hidden: true })
  assert.equal(calls[17].body, undefined)
})

test('대표 사진을 multipart file과 CSRF로 업로드하며 Content-Type 경계는 브라우저가 정한다', async () => {
  Object.defineProperty(globalThis, 'document', { value: { cookie: 'XSRF-TOKEN=photo-token' }, configurable: true, writable: true })
  const photo = new File([new Uint8Array([255, 216, 255])], 'club.jpg', { type: 'image/jpeg' })
  const calls: string[] = []
  globalThis.fetch = (async (input, init) => {
    calls.push(init?.method + ' ' + new URL(String(input)).pathname)
    const headers = new Headers(init?.headers)
    assert.equal(init?.credentials, 'include')
    assert.equal(headers.get('X-XSRF-TOKEN'), 'photo-token')
    assert.equal(headers.has('Content-Type'), false)
    if (init?.method === 'POST') {
      assert.ok(init.body instanceof FormData)
      assert.deepEqual([...init.body.keys()], ['file'])
      const uploaded = init.body.get('file') as File
      assert.equal(uploaded.name, photo.name)
      assert.equal(uploaded.type, photo.type)
      assert.deepEqual(await uploaded.arrayBuffer(), await photo.arrayBuffer())
      return Response.json({ data: { id: 3, photoUrl: '/uploads/club.jpg' } })
    }
    assert.equal(init?.body, undefined)
    return new Response(null, { status: 204 })
  }) as typeof fetch
  await content.uploadAdminClubPhoto(3, photo)
  await content.deleteAdminClubPhoto(3)
  assert.deepEqual(calls, ['POST /api/v1/admin/clubs/3/photo', 'DELETE /api/v1/admin/clubs/3/photo'])
})

test('사진 형식·빈 파일·10MB 제한을 전송 전에 검사한다', () => {
  globalThis.fetch = (() => { throw new Error('잘못된 파일은 전송하면 안 됨') }) as typeof fetch
  assert.throws(() => content.uploadAdminClubPhoto(3, new File(['gif'], 'club.gif', { type: 'image/gif' })), /JPG 또는 PNG/)
  assert.throws(() => content.uploadAdminClubPhoto(3, new File([], 'club.png', { type: 'image/png' })), /비어 있는/)
  assert.throws(() => validateClubPhoto({ type: 'image/jpeg', size: MAX_CLUB_PHOTO_BYTES + 1 }), /10MB/)
  assert.doesNotThrow(() => validateClubPhoto({ type: 'image/jpeg', size: MAX_CLUB_PHOTO_BYTES }))
  assert.doesNotThrow(() => validateClubPhoto({ type: 'image/png', size: 1 }))
})

test('사진 업로드·삭제 실패를 성공으로 처리하거나 자동 재시도하지 않는다', async () => {
  Object.defineProperty(globalThis, 'document', { value: { cookie: 'XSRF-TOKEN=photo-token' }, configurable: true, writable: true })
  let calls = 0
  globalThis.fetch = (async () => {
    calls++
    return Response.json({ status: 413, code: 'PHOTO_TOO_LARGE', message: '사진 크기 초과' }, { status: 413 })
  }) as typeof fetch
  const photo = new File(['test'], 'club.png', { type: 'image/png' })
  await assert.rejects(content.uploadAdminClubPhoto(3, photo), (error: unknown) => error instanceof ApiError && error.status === 413)
  await assert.rejects(content.deleteAdminClubPhoto(3), (error: unknown) => error instanceof ApiError && error.code === 'PHOTO_TOO_LARGE')
  assert.equal(calls, 2)
})
