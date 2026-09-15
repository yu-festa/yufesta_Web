import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ANNOUNCEMENT_TIMESTAMP, getCountdown } from '../src/utils/countdown.ts'

test('발표 시각은 2026년 10월 2일 오전 11시 한국 시간이다', () => {
  assert.equal(new Date(ANNOUNCEMENT_TIMESTAMP).toISOString(), '2026-10-02T02:00:00.000Z')
})

test('일·시간·분·초 경계에서 정확히 내려간다', () => {
  const dayBefore = ANNOUNCEMENT_TIMESTAMP - 86400000
  assert.deepEqual(getCountdown(dayBefore), { days: 1, hours: 0, minutes: 0, seconds: 0, ended: false })
  assert.deepEqual(getCountdown(dayBefore + 1000), { days: 0, hours: 23, minutes: 59, seconds: 59, ended: false })
  assert.deepEqual(getCountdown(ANNOUNCEMENT_TIMESTAMP - 60000), { days: 0, hours: 0, minutes: 1, seconds: 0, ended: false })
  assert.equal(getCountdown(ANNOUNCEMENT_TIMESTAMP - 59000).seconds, 59)
})

test('마지막 1초가 끝나기 전에는 완료로 표시하지 않는다', () => {
  assert.equal(getCountdown(ANNOUNCEMENT_TIMESTAMP - 1).seconds, 1)
  assert.equal(getCountdown(ANNOUNCEMENT_TIMESTAMP - 1).ended, false)
})

test('발표 시각 이후에는 음수 대신 0에서 멈춘다', () => {
  for (const now of [ANNOUNCEMENT_TIMESTAMP, ANNOUNCEMENT_TIMESTAMP + 86400000]) {
    assert.deepEqual(getCountdown(now), { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true })
  }
})

test('백그라운드에서 지난 시간도 현재 시각으로 보정한다', () => {
  assert.equal(getCountdown(ANNOUNCEMENT_TIMESTAMP - 3600000).hours, 1)
  assert.deepEqual(getCountdown(ANNOUNCEMENT_TIMESTAMP - 125000), { days: 0, hours: 0, minutes: 2, seconds: 5, ended: false })
})
