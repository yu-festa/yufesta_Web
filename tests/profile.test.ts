import assert from 'node:assert/strict'
import { test } from 'node:test'
import { profileFromApplication, resolveProfileAccess } from '../src/utils/profile.ts'
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

test('서버 신청 내역을 프로필 참여 내역으로 변환한다', () => {
  const user = profileFromApplication({
    id: 12, roundSeq: 2, instagramId: 'yu.festa', nickname: '펭귄', gender: 'F', ageBand: '22-24',
    tags: ['PERFORMANCE', 'MUSIC'], intro: '같이 공연 봐요', entryType: 'NEW', createdAt: '2026-09-22T12:00:00',
  })
  assert.equal(user.name, '펭귄')
  assert.equal(user.instagram, 'yu.festa')
  assert.equal(user.participations[0]?.round, '2차')
  assert.deepEqual(user.participations[0]?.interests, ['공연', '음악'])
  assert.deepEqual(user.participations[0]?.result, { status: 'pending' })
})
