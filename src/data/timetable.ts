import type { TimetableSlot } from '../api/timetable.ts'
import { parseMatchTime } from '../utils/match.ts'

export const festivalTitle = '2026 영남대학교 가을축제'

type Rectangle = { kind: 'rect'; x: number; y: number; width: number; height: number; fill: string; shadow?: boolean }
type Circle = { kind: 'circle'; x: number; y: number; radius: number; fill: string }
type Label = { kind: 'text'; x: number; y: number; text: string; size: number; weight: number; fill: string; anchor: 'middle' | 'end' }
export type TimetableShape = Rectangle | Circle | Label
export type TimetableLayout = { width: number; height: number; left: number; columnWidth: number; scheduleTop: number; pixelsPerMinute: number }

const KST_MINUTES = 9 * 60
const MINUTES_PER_DAY = 24 * 60
const columnWidth = 164
const left = 48
const scheduleTop = 64
const headerHeight = 26

function kstMinute(value: string) {
  const time = parseMatchTime(value)
  return Number.isFinite(time) ? Math.floor(time / 60000) + KST_MINUTES : NaN
}

function timeLabel(minute: number, firstDay: number) {
  const elapsed = minute - firstDay * MINUTES_PER_DAY
  return `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
}

function shortTitle(title: string, width: number) {
  const budget = (width - 16) / 13
  let used = 0
  let result = ''
  for (const letter of title) {
    const cost = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/u.test(letter) ? 1 : 0.58
    if (used + cost > budget) return `${result.trimEnd()}…`
    result += letter
    used += cost
  }
  return result
}

// 화면 SVG와 저장 PNG는 이 도형·좌표를 공유합니다. 시간은 서버 응답의 KST 기준으로 계산합니다.
export function buildTimetable(slots: TimetableSlot[]): { layout: TimetableLayout; shapes: TimetableShape[] } {
  const valid = slots.map(slot => ({ slot, start: kstMinute(slot.effectiveStartAt), end: kstMinute(slot.effectiveEndAt) }))
    .filter(item => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start)
    .sort((a, b) => a.start - b.start || a.slot.sortOrder - b.slot.sortOrder)
  const stageKeys = [...new Set(valid.map(item => String(item.slot.stage?.placeId ?? 'unknown')))]
  const stageNames = stageKeys.map(key => valid.find(item => String(item.slot.stage?.placeId ?? 'unknown') === key)?.slot.stage?.name ?? '장소 미정')
  // 기존 디자인은 같은 무대의 공연도 좌우 두 칸에 번갈아 배치했습니다.
  const stageCount = Math.max(2, stageKeys.length)
  const displayColumnWidth = columnWidth
  const earliest = valid.length ? Math.min(...valid.map(item => item.start)) : 0
  const latest = valid.length ? Math.max(...valid.map(item => item.end)) : 60
  const start = Math.floor(earliest / 60) * 60
  const end = Math.ceil(latest / 60) * 60
  const shortest = Math.min(...valid.map(item => item.end - item.start), 40)
  const pixelsPerMinute = Math.max(2.12, Math.min(6, 52 / shortest))
  const layout = { width: left + displayColumnWidth * stageCount + 14, height: scheduleTop + (end - start) * pixelsPerMinute + 20, left, columnWidth: displayColumnWidth, scheduleTop, pixelsPerMinute }
  const shapes: TimetableShape[] = []
  const liveBadges: TimetableShape[] = []
  const firstDay = Math.floor(start / MINUTES_PER_DAY)

  const displayStages = stageKeys.length === 1 ? [stageNames[0], stageNames[0]] : stageNames
  displayStages.forEach((name, index) => {
    const x = left + index * displayColumnWidth
    shapes.push({ kind: 'rect', x, y: 0, width: displayColumnWidth, height: headerHeight, fill: index % 2 === 0 ? '#cddcff' : '#7d9dff' })
    shapes.push({ kind: 'text', x: x + displayColumnWidth / 2, y: headerHeight / 2, text: name, size: 11, weight: 500, fill: '#111111', anchor: 'middle' })
  })
  for (let minute = start; minute <= end; minute += 60) {
    shapes.push({ kind: 'text', x: left - 12, y: scheduleTop + (minute - start) * pixelsPerMinute, text: timeLabel(minute, firstDay), size: 10, weight: 500, fill: '#111111', anchor: 'end' })
  }
  valid.forEach(({ slot, start: slotStart, end: slotEnd }, index) => {
    const stage = stageKeys.length === 1 ? index % 2 : stageKeys.indexOf(String(slot.stage?.placeId ?? 'unknown'))
    const x = left + stage * displayColumnWidth
    const y = scheduleTop + (slotStart - start) * pixelsPerMinute
    const height = (slotEnd - slotStart) * pixelsPerMinute
    const centerX = x + displayColumnWidth / 2
    const centerY = y + height / 2
    const fill = index === 0 ? '#cddcff' : index === 1 ? '#7d9dff' : '#ebebeb'
    shapes.push({ kind: 'rect', x, y, width: displayColumnWidth, height, fill, shadow: index < 2 })
    shapes.push({ kind: 'text', x: centerX, y: centerY - (height < 60 ? 7 : 13), text: shortTitle(slot.title, displayColumnWidth), size: slot.title.length > 20 ? 12 : 15, weight: 500, fill: '#111111', anchor: 'middle' })
    shapes.push({ kind: 'text', x: centerX, y: centerY + (height < 60 ? 10 : 5), text: `${timeLabel(slotStart, firstDay)}-${timeLabel(slotEnd, firstDay)}`, size: 10, weight: 400, fill: '#333333', anchor: 'middle' })
    if (height >= 60) shapes.push({ kind: 'text', x: centerX, y: centerY + 19, text: `(${slotEnd - slotStart}분)`, size: 10, weight: 400, fill: '#333333', anchor: 'middle' })
    if (slot.isLive) {
      const badgeX = x + displayColumnWidth - 2
      const badgeY = y + 2
      liveBadges.push({ kind: 'circle', x: badgeX, y: badgeY, radius: 16, fill: '#ff2028' })
      liveBadges.push({ kind: 'text', x: badgeX, y: badgeY, text: 'LIVE', size: 11, weight: 700, fill: '#ffffff', anchor: 'middle' })
    }
  })
  return { layout, shapes: [...shapes, ...liveBadges] }
}
