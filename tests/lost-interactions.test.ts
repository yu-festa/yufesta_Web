import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { createLostItemComment, createLostItemReply, deleteLostItemComment, deleteLostItemImage, getLostItemComments, getLostItems, uploadLostItemImage } from '../src/api/lostItems.ts'
import { createContentReport } from '../src/api/contentReports.ts'
import { getAdminContentReports, setLostItemCommentVisibility } from '../src/api/adminContent.ts'
import { ApiError } from '../src/api/client.ts'
import { MAX_LOST_IMAGE_BYTES, validateLostItemImage } from '../src/utils/lostItemImage.ts'

const originalFetch = globalThis.fetch
const originalDocument = globalThis.document
const image = { id: 20, imageUrl: 'https://images.example/lost.png', thumbnailUrl: 'https://images.example/lost-small.png' }
const comment = { id: 11, parentId: null, content: '안내소에 맡겼어요', displayName: '익명', mine: false, postAuthor: true, deleted: false, createdAt: '2026-09-26T12:00:00', replies: [{ id: 12, parentId: 11, content: '감사합니다', displayName: '내 이름', mine: true, postAuthor: false, deleted: false, createdAt: '2026-09-26T12:01:00', replies: [] }] }
const setCookie = () => Object.defineProperty(globalThis, 'document', { value: { cookie: 'XSRF-TOKEN=lost-token' }, configurable: true, writable: true })
afterEach(() => { globalThis.fetch = originalFetch; Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true, writable: true }) })

test('비로그인 조회로 사진 정보와 삭제 상태·작성자·답글 구조를 그대로 받는다', async () => {
  Object.defineProperty(globalThis, 'document', { value: { cookie: '' }, configurable: true, writable: true })
  const calls: string[] = []
  globalThis.fetch = (async (input, init) => {
    const path = new URL(String(input)).pathname; calls.push(path)
    assert.equal(init?.method, 'GET')
    return Response.json({ data: path.endsWith('/comments') ? [comment, { ...comment, id: 13, deleted: true, replies: [] }] : [{ id: 7, image }] })
  }) as typeof fetch
  assert.deepEqual((await getLostItems())[0].image, image)
  const comments = await getLostItemComments(7)
  assert.equal(comments[0].postAuthor, true)
  assert.equal(comments[0].replies[0].mine, true)
  assert.equal(comments[1].deleted, true)
  assert.deepEqual(calls, ['/api/v1/lost-items', '/api/v1/lost-items/7/comments'])
})

test('분실물 사진은 한 개의 multipart file로 보내고 삭제는 이미지 ID를 사용한다', async () => {
  setCookie()
  const calls: string[] = []
  const file = new File(['photo'], 'lost.png', { type: 'image/png' })
  globalThis.fetch = (async (input, init) => {
    calls.push(`${init?.method} ${new URL(String(input)).pathname}`)
    assert.equal(init?.credentials, 'include')
    assert.equal(new Headers(init?.headers).get('X-XSRF-TOKEN'), 'lost-token')
    assert.equal(new Headers(init?.headers).has('Content-Type'), false)
    if (init?.method === 'DELETE') { assert.equal(init.body, undefined); return new Response(null, { status: 204 }) }
    assert.ok(init?.body instanceof FormData)
    assert.deepEqual([...init.body.keys()], ['file'])
    assert.equal((init.body.get('file') as File).name, 'lost.png')
    return Response.json({ data: image })
  }) as typeof fetch
  assert.deepEqual(await uploadLostItemImage(7, file), image)
  await deleteLostItemImage(7, 20)
  assert.deepEqual(calls, ['POST /api/v1/lost-items/7/images', 'DELETE /api/v1/lost-items/7/images/20'])
})

test('잘못된 사진·빈 댓글·200자 초과 댓글을 전송 전에 거부한다', () => {
  globalThis.fetch = (() => { throw new Error('전송하면 안 됨') }) as typeof fetch
  assert.throws(() => uploadLostItemImage(7, new File(['x'], 'photo.gif', { type: 'image/gif' })), /JPG 또는 PNG/)
  assert.throws(() => uploadLostItemImage(7, new File([], 'photo.png', { type: 'image/png' })), /비어 있는/)
  assert.throws(() => validateLostItemImage({ type: 'image/jpeg', size: MAX_LOST_IMAGE_BYTES + 1 }), /10MB/)
  assert.doesNotThrow(() => validateLostItemImage({ type: 'image/jpeg', size: MAX_LOST_IMAGE_BYTES }))
  assert.throws(() => createLostItemComment(7, ' '), /1~200/)
  assert.throws(() => createLostItemReply(7, 11, '가'.repeat(201)), /1~200/)
})

test('댓글·답글 작성과 삭제·신고가 정확한 글 및 댓글 ID와 CSRF를 사용한다', async () => {
  setCookie()
  const calls: { path: string; method: string; body: unknown }[] = []
  globalThis.fetch = (async (input, init) => {
    assert.equal(init?.credentials, 'include')
    assert.equal(new Headers(init?.headers).get('X-XSRF-TOKEN'), 'lost-token')
    calls.push({ path: new URL(String(input)).pathname, method: init?.method ?? '', body: init?.body ? JSON.parse(String(init.body)) : undefined })
    return init?.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json({ data: comment })
  }) as typeof fetch
  await createLostItemComment(7, ' 안내소에 맡겼어요 ')
  await createLostItemReply(7, 11, '감사합니다')
  await deleteLostItemComment(7, 12)
  await createContentReport('LOST_ITEM_COMMENT', 11, '부적절한 댓글')
  assert.deepEqual(calls, [
    { path: '/api/v1/lost-items/7/comments', method: 'POST', body: { content: '안내소에 맡겼어요' } },
    { path: '/api/v1/lost-items/7/comments/11/replies', method: 'POST', body: { content: '감사합니다' } },
    { path: '/api/v1/lost-items/7/comments/12', method: 'DELETE', body: undefined },
    { path: '/api/v1/content-reports', method: 'POST', body: { targetType: 'LOST_ITEM_COMMENT', targetId: 11, reason: '부적절한 댓글' } },
  ])
})

test('운영자 댓글 신고 필터와 숨김·복구는 분실물 글 번호를 함께 사용한다', async () => {
  setCookie()
  const calls: { path: string; body: unknown }[] = []
  globalThis.fetch = (async (input, init) => {
    const url = new URL(String(input))
    calls.push({ path: url.pathname + url.search, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    if (init?.method === 'PATCH') assert.equal(new Headers(init.headers).get('X-XSRF-TOKEN'), 'lost-token')
    return Response.json({ data: init?.method === 'PATCH' ? comment : [] })
  }) as typeof fetch
  await getAdminContentReports(false, 'LOST_ITEM_COMMENT')
  assert.equal((await setLostItemCommentVisibility(7, 11, true)).id, 11)
  await setLostItemCommentVisibility(7, 11, false)
  assert.deepEqual(calls, [
    { path: '/api/v1/admin/content-reports?page=0&size=20&reviewed=false&targetType=LOST_ITEM_COMMENT', body: undefined },
    { path: '/api/v1/admin/lost-items/7/comments/11/visibility', body: { hidden: true } },
    { path: '/api/v1/admin/lost-items/7/comments/11/visibility', body: { hidden: false } },
  ])
})

test('사진 중복·권한·미발견 및 댓글 실패를 성공으로 처리하거나 자동 재시도하지 않는다', async () => {
  setCookie()
  let calls = 0
  for (const [status, code] of [[409, 'LOST_ITEM_IMAGE_ALREADY_EXISTS'], [403, 'FORBIDDEN'], [404, 'LOST_ITEM_NOT_FOUND']] as const) {
    globalThis.fetch = (async () => { calls++; return Response.json({ status, code, message: code }, { status }) }) as typeof fetch
    await assert.rejects(uploadLostItemImage(7, new File(['x'], 'image.png', { type: 'image/png' })), (error: unknown) => error instanceof ApiError && error.code === code)
  }
  globalThis.fetch = (async () => { calls++; return Response.json({ status: 400, code: 'LOST_ITEM_COMMENT_REPLY_NOT_ALLOWED', message: '답글의 답글 불가' }, { status: 400 }) }) as typeof fetch
  await assert.rejects(createLostItemReply(7, 12, '답글'), (error: unknown) => error instanceof ApiError && error.status === 400)
  assert.equal(calls, 4)
})
