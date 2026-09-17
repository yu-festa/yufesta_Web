import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterLostPosts, formatLostPostTime, validateLostPost } from '../src/utils/lostFound.ts'
import type { LostPost, LostPostDraft } from '../src/utils/lostFound.ts'

const draft: LostPostDraft = { kind: 'lost', title: '흰색 에어팟을 찾습니다', location: '공연장 앞', content: '흰색 케이스에 파란 스티커가 있어요.', photos: [] }

test('사진 없는 글은 허용하고 공백뿐인 필수 입력은 거부한다', () => {
  assert.equal(validateLostPost(draft), null)
  for (const field of ['title', 'location', 'content']) {
    assert.ok(validateLostPost({ ...draft, [field]: ' \n\t ' }))
  }
})

test('제목·장소·내용 길이와 사진 다섯 장 제한을 검사한다', () => {
  for (const [field, limit] of [['title', 80], ['location', 100], ['content', 3000]] as const) {
    assert.equal(validateLostPost({ ...draft, [field]: '가'.repeat(limit) }), null)
    assert.ok(validateLostPost({ ...draft, [field]: '가'.repeat(limit + 1) }))
  }
  const photos = Array.from({ length: 6 }, (_, index) => ({ id: String(index), src: 'data:image/webp;base64,test' }))
  assert.equal(validateLostPost({ ...draft, photos: photos.slice(0, 5) }), null)
  assert.ok(validateLostPost({ ...draft, photos }))
})

test('검색과 카테고리를 함께 적용하고 최신 글부터 표시한다', () => {
  const posts: LostPost[] = [
    { ...draft, id: 'old', createdAt: 1 },
    { ...draft, id: 'new', createdAt: 3, kind: 'found', title: 'AirPods 주웠어요' },
    { ...draft, id: 'other', createdAt: 2, title: '검은 지갑', location: '정문', content: '학생증이 들어 있어요' },
  ]
  assert.deepEqual(filterLostPosts(posts, 'all', '').map(post => post.id), ['new', 'other', 'old'])
  assert.deepEqual(filterLostPosts(posts, 'found', ' 공연장 ').map(post => post.id), ['new'])
  assert.deepEqual(filterLostPosts(posts, 'all', 'AIRPODS').map(post => post.id), ['new'])
  assert.deepEqual(filterLostPosts(posts, 'all', '학생증').map(post => post.id), ['other'])
  assert.deepEqual(filterLostPosts(posts, 'lost', 'AIRPODS'), [])
  assert.deepEqual(posts.map(post => post.id), ['old', 'new', 'other'])
})

test('작성 시각 경계 및 미래 시각을 자연스럽게 표시한다', () => {
  const now = 2_000_000_000_000
  assert.equal(formatLostPostTime(now, now), '방금 전')
  assert.equal(formatLostPostTime(now + 5000, now), '방금 전')
  assert.equal(formatLostPostTime(now - 60_000, now), '1분 전')
  assert.equal(formatLostPostTime(now - 3_600_000, now), '1시간 전')
  assert.equal(formatLostPostTime(now - 86_400_000, now), '1일 전')
})
