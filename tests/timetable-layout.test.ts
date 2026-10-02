import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { TimetableSlot } from '../src/api/timetable.ts'
import { buildTimetable } from '../src/data/timetable.ts'

function slot(id: number, title: string, start: string, end: string, stageId = 1): TimetableSlot {
  return {
    id, sortOrder: id, title, slotType: 'CLUB', startAt: start, endAt: end,
    effectiveStartAt: start, effectiveEndAt: end, delayMinutes: null,
    isLive: false, isChanged: false, changedFromStart: null,
    stage: { placeId: stageId, name: stageId === 1 ? '중앙 무대' : '서쪽 무대' }, club: null,
  }
}

test('원래 차트처럼 한 무대의 공연도 좌우 두 열에 배치하고 서버의 변경 시각과 LIVE를 그린다', () => {
  const opening = slot(1, '개회식', '2026-10-02T15:00:00', '2026-10-02T15:10:00')
  const delayed = slot(2, '신명마당', '2026-10-02T15:20:00', '2026-10-02T15:45:00')
  delayed.effectiveStartAt = '2026-10-02T15:30:00'
  delayed.effectiveEndAt = '2026-10-02T15:55:00'
  delayed.isChanged = true
  delayed.isLive = true
  const { layout, shapes } = buildTimetable([opening, delayed])

  assert.equal(layout.width, 390)
  assert.deepEqual(shapes.filter(shape => shape.kind === 'rect' && shape.y === 0).map(shape => shape.x), [48, 212])
  assert.deepEqual(shapes.filter(shape => shape.kind === 'rect' && shape.y > 0).map(shape => shape.x), [48, 212])
  assert.deepEqual(shapes.filter(shape => shape.kind === 'rect' && shape.y > 0).map(shape => shape.fill), ['#ebebeb', '#cddcff'])
  assert.ok(shapes.some(shape => shape.kind === 'text' && shape.text === '15:30-15:55'))
  assert.ok(shapes.some(shape => shape.kind === 'text' && shape.text === 'LIVE'))
})

test('서로 다른 무대는 각 열에 고정하고 자정 이후도 이어지는 시각으로 표시한다', () => {
  const first = slot(1, '첫 공연', '2026-10-02T23:45:00', '2026-10-03T00:15:00')
  const second = slot(2, '둘째 공연', '2026-10-03T00:20:00', '2026-10-03T00:50:00', 2)
  const third = slot(3, '셋째 공연', '2026-10-03T00:55:00', '2026-10-03T01:15:00')
  const { shapes } = buildTimetable([first, second, third])

  assert.deepEqual(shapes.filter(shape => shape.kind === 'rect' && shape.y > 0).map(shape => shape.x), [48, 212, 48])
  assert.ok(shapes.some(shape => shape.kind === 'text' && shape.text === '24:00'))
  assert.ok(shapes.some(shape => shape.kind === 'text' && shape.text === '24:20-24:50'))
})

test('서버의 LIVE 전환을 따라 현재 공연과 변경 시간순 바로 다음 공연의 색상·그림자가 이동한다', () => {
  const opening = slot(1, '개회식', '2026-10-02T15:00:00', '2026-10-02T15:10:00')
  const delayed = slot(2, '지연 공연', '2026-10-02T15:10:00', '2026-10-02T15:20:00')
  delayed.effectiveStartAt = '2026-10-02T15:30:00'
  delayed.effectiveEndAt = '2026-10-02T15:40:00'
  const current = slot(3, '현재 공연', '2026-10-02T15:20:00', '2026-10-02T15:30:00')
  const closing = slot(4, '마지막 공연', '2026-10-02T15:40:00', '2026-10-02T15:50:00')
  const slots = [closing, delayed, opening, current]
  const appearance = () => buildTimetable(slots).shapes
    .filter(shape => shape.kind === 'rect')
    .filter(shape => shape.y > 0)
    .map(shape => ({ fill: shape.fill, shadow: shape.shadow }))
  const inactive = { fill: '#ebebeb', shadow: false }
  const live = { fill: '#cddcff', shadow: true }
  const next = { fill: '#7d9dff', shadow: true }

  current.isLive = true
  assert.deepEqual(appearance(), [inactive, live, next, inactive])

  current.isLive = false
  delayed.isLive = true
  assert.deepEqual(appearance(), [inactive, inactive, live, next])

  delayed.isLive = false
  closing.isLive = true
  assert.deepEqual(appearance(), [inactive, inactive, inactive, live])

  closing.isLive = false
  assert.deepEqual(appearance(), [inactive, inactive, inactive, inactive])
})
