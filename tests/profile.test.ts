import assert from 'node:assert/strict'
import { test } from 'node:test'
import { profileFromSession, resolveProfileAccess } from '../src/utils/profile.ts'
import type { ProfileUser } from '../src/utils/profile.ts'

test('미리보기 해제 시 비로그인 사용자는 프로필 데이터 없이 로그인으로 보낸다', () => {
  assert.deepEqual(resolveProfileAccess(null, false), { page: 'login', user: null, isPreview: false })
})

test('API 연동 전 미리보기는 예시 사용자와 참여 내역을 제공한다', () => {
  const access = resolveProfileAccess(null, true)
  assert.equal(access.page, 'profile')
  assert.equal(access.isPreview, true)
  assert.ok(access.user?.name)
  assert.equal(access.user?.participations.length, 1)
})

test('로그인 사용자는 미리보기 설정과 관계없이 본인 정보와 내역을 사용한다', () => {
  const user: ProfileUser = { id: 'user-1', name: '테스트', instagram: 'test_user', participations: [] }
  for (const previewEnabled of [true, false]) {
    const access = resolveProfileAccess(user, previewEnabled)
    assert.equal(access.page, 'profile')
    assert.equal(access.user, user)
    assert.equal(access.isPreview, false)
    assert.equal(access.user?.participations.length, 0)
  }
})

test('소셜 프로필을 표시하고 신청 닉네임은 참여 내역에 보존한다', () => {
  const user = profileFromSession({ role: 'USER', displayName: '홍길동', profileImageUrl: 'https://example.com/social-profile.jpg' }, {
    id: 12, roundSeq: 2, instagramId: 'yu.festa', nickname: '펭귄', gender: 'F', ageBand: '22-24',
    tags: ['PERFORMANCE', 'MUSIC'], intro: '같이 공연 봐요', wantedSlot: null, needsSlotReselect: false, entryType: 'NEW', createdAt: '2026-09-22T12:00:00',
  })
  assert.equal(user.name, '홍길동')
  assert.equal(user.profileImageUrl, 'https://example.com/social-profile.jpg')
  assert.equal(user.instagram, 'yu.festa')
  assert.equal(user.participations[0]?.nickname, '펭귄')
  assert.equal(user.participations[0]?.round, '2차')
  assert.deepEqual(user.participations[0]?.interests, ['공연', '음악'])
  assert.deepEqual(user.participations[0]?.result, { status: 'pending' })
})

test('인스타팅 신청이 없어도 소셜 이름과 프로필 사진을 표시한다', () => {
  const user = profileFromSession({ role: 'USER', displayName: ' 홍길동 ', profileImageUrl: ' https://example.com/social-profile.jpg ' }, null)
  assert.equal(user.name, '홍길동')
  assert.equal(user.profileImageUrl, 'https://example.com/social-profile.jpg')
  assert.equal(user.instagram, '')
  assert.deepEqual(user.participations, [])
})

test('소셜 이름과 사진이 비어 있으면 기본 프로필을 사용한다', () => {
  for (const value of [null, '', '   ']) {
    const user = profileFromSession({ role: 'USER', displayName: value, profileImageUrl: value }, null)
    assert.equal(user.name, 'YU FESTA')
    assert.equal(user.profileImageUrl, null)
  }
})
