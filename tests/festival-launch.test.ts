import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FESTIVAL_START_AT, FESTIVAL_START_TIMESTAMP, getFestivalCountdown, resolveFestivalHome, resolveFestivalStart } from '../src/utils/festivalLaunch.ts'

test('축제 오픈은 2026년 10월 2일 0시 한국 시간이다', () => {
  assert.equal(FESTIVAL_START_AT, '2026-10-02T00:00:00+09:00')
  assert.equal(new Date(FESTIVAL_START_TIMESTAMP).toISOString(), '2026-10-01T15:00:00.000Z')
})

test('오픈 직전에는 랜딩과 1초를 표시하고 정각부터 메인으로 바뀐다', () => {
  const before = FESTIVAL_START_TIMESTAMP - 1
  assert.equal(resolveFestivalHome(before), 'landing')
  assert.equal(getFestivalCountdown(before).seconds, 1)
  assert.equal(getFestivalCountdown(before).ended, false)
  assert.equal(resolveFestivalHome(FESTIVAL_START_TIMESTAMP), 'main')
  assert.deepEqual(getFestivalCountdown(FESTIVAL_START_TIMESTAMP), { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true })
})

test('오픈 이후 재방문과 백그라운드 복귀에서도 메인과 0을 유지한다', () => {
  assert.equal(resolveFestivalHome(FESTIVAL_START_TIMESTAMP + 86400000), 'main')
  assert.equal(getFestivalCountdown(FESTIVAL_START_TIMESTAMP + 86400000).days, 0)
  assert.equal(getFestivalCountdown(FESTIVAL_START_TIMESTAMP - 90061000).days, 1)
  assert.equal(getFestivalCountdown(FESTIVAL_START_TIMESTAMP - 90061000).hours, 1)
  assert.equal(getFestivalCountdown(FESTIVAL_START_TIMESTAMP - 90061000).minutes, 1)
  assert.equal(getFestivalCountdown(FESTIVAL_START_TIMESTAMP - 90061000).seconds, 1)
})

test('개발용 시각은 명시적 시간대가 있어야 하며 잘못된 값은 공식 시각을 쓴다', () => {
  assert.equal(resolveFestivalStart('2026-09-17T12:00:00+09:00'), Date.parse('2026-09-17T03:00:00Z'))
  for (const value of [undefined, '', 'wrong', '2026-10-02T00:00:00', 'invalid+09:00']) assert.equal(resolveFestivalStart(value), FESTIVAL_START_TIMESTAMP)
})
