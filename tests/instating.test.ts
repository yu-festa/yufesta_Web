import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AlreadyAppliedError, nextRevealTap, parseApplications, saveApplication } from '../src/utils/instating.ts'
import { resolveProfileAccess } from '../src/utils/profile.ts'

const application = { id: 'local-1', submittedAt: '2026-09-17T00:00:00Z', nickname: '테스트', instagram: 'test_mate', gender: '여', age: '22 - 24세', tags: ['공연'], performance: '', introduction: '안녕하세요', multipleMatches: false }

test('최초 신청 후 다른 아이디로 다시 신청해도 기존 한 건만 유지한다', async () => {
  let value: string | null = null
  const storage = { getItem: () => value, setItem: (_key: string, next: string) => { value = next } }
  const saved = await saveApplication(application, storage)
  await assert.rejects(saveApplication({ ...application, instagram: 'another_id' }, storage), AlreadyAppliedError)
  assert.deepEqual(parseApplications(value), [saved])
})

test('동시 제출 두 건 중 한 건만 저장되고 기존 데이터가 덮어써지지 않는다', async () => {
  let value: string | null = null
  const storage = { getItem: () => value, setItem: (_key: string, next: string) => { value = next } }
  const results = await Promise.allSettled([saveApplication(application, storage), saveApplication(application, storage)])
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(parseApplications(value).length, 1)
})

test('재신청 테스트 옵션은 기존 내역을 보존하고 옵션을 끄면 다시 중복을 차단한다', async () => {
  let value: string | null = null
  const storage = { getItem: () => value, setItem: (_key: string, next: string) => { value = next } }
  const first = await saveApplication(application, storage)
  const second = await saveApplication({ ...application, nickname: '재신청 테스트' }, storage, { allowRepeat: true })
  assert.notEqual(first.id, second.id)
  assert.deepEqual(parseApplications(value), [second, first])
  await assert.rejects(saveApplication(application, storage), AlreadyAppliedError)
  assert.deepEqual(parseApplications(value), [second, first])
})

test('저장 실패는 신청 완료로 처리하지 않으며 다시 저장할 수 있다', async () => {
  let value: string | null = null
  let fail = true
  const storage = { getItem: () => value, setItem: (_key: string, next: string) => { if (fail) throw new Error('quota'); value = next } }
  await assert.rejects(saveApplication(application, storage), /quota/)
  assert.equal(value, null)
  fail = false
  await saveApplication(application, storage)
  assert.equal(parseApplications(value).length, 1)
})

test('결과는 다섯 번째 터치에서만 공개되며 연속 입력에도 5회를 넘지 않는다', () => {
  let taps = 0
  for (let i = 1; i <= 4; i++) { taps = nextRevealTap(taps); assert.ok(taps < 5) }
  assert.equal(nextRevealTap(taps), 5)
  assert.equal(nextRevealTap(5), 5)
})

test('저장된 신청 내용을 읽고 손상되거나 잘못된 데이터는 제외한다', () => {
  assert.deepEqual(parseApplications(JSON.stringify([application])), [application])
  assert.deepEqual(parseApplications('{invalid'), [])
  assert.deepEqual(parseApplications(null), [])
  assert.deepEqual(parseApplications(JSON.stringify([null, {}, { ...application, instagram: 'https://malicious' }, { ...application, tags: [null] }])), [])
})

test('로컬 신청은 마이페이지에 발표 대기로 연결하고 성공 결과를 임의로 만들지 않는다', () => {
  const access = resolveProfileAccess(null, true, [application])
  assert.equal(access.user?.name, application.nickname)
  assert.equal(access.user?.participations[0].id, application.id)
  assert.deepEqual(access.user?.participations[0].result, { status: 'pending' })
  assert.equal(access.user?.participations[1].isDemo, true)
})

test('로그인 상태가 없고 미리보기가 꺼져 있으면 로컬 신청 내역으로 인증을 우회하지 않는다', () => {
  assert.deepEqual(resolveProfileAccess(null, false, [application]), { page: 'login', user: null, isPreview: false })
  const user = { id: 'real-user', name: '본인', instagram: 'real_user', participations: [] }
  assert.equal(resolveProfileAccess(user, true, [application]).user, user)
})
