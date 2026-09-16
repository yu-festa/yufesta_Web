// 첨부된 디자인의 예시 일정입니다. 실제 축제 일정 공개 시 이 데이터를 교체합니다.
export const festivalTitle = '2026 영남대학교 가을축제'

export type Performance = {
  id: string
  name: string
  stage: 0 | 1
  start: string
  end: string
  highlight?: 'light' | 'blue'
  isLive?: boolean
}

export const stages = ['LAND STAGE', 'LAND STAGE'] as const

export const performances: Performance[] = [
  { id: 'tensional', name: '텐셔널 순간들', stage: 0, start: '15:00', end: '15:40', highlight: 'light', isLive: true },
  { id: 'sawi', name: '사위', stage: 1, start: '15:45', end: '16:25', highlight: 'blue' },
  { id: 'green-flame', name: '초록불꽃소년단', stage: 0, start: '16:30', end: '17:10' },
  { id: 'the-chairs', name: 'THE CHAIRS', stage: 1, start: '17:15', end: '17:55' },
  { id: 'goonam', name: '구남과여라이딩스텔라', stage: 0, start: '18:00', end: '18:40' },
  { id: 'sumin', name: 'SUMIN', stage: 1, start: '18:45', end: '19:25' },
  { id: 'minami-deutsch', name: 'MINAMI DEUTSCH', stage: 0, start: '19:30', end: '20:10' },
  { id: 'kim-hyunchul', name: '김현철', stage: 1, start: '20:15', end: '20:55' },
  { id: 'babo', name: '바보', stage: 0, start: '21:00', end: '21:40' },
  { id: 'kim-mingyu', name: '김민규', stage: 1, start: '21:45', end: '22:25' },
  { id: 'telepopmusik', name: 'TELEPOPMUSIK (DJ SET)', stage: 0, start: '22:40', end: '23:30' },
  { id: 'ko-shin-moon', name: 'KO SHIN MOON', stage: 1, start: '23:35', end: '24:15' },
  { id: 'hitech', name: 'HITECH', stage: 0, start: '24:20', end: '25:10' },
]

// 24시 이후 표기도 다음 날의 연속된 분으로 계산합니다.
export function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export const timetableLayout = {
  width: 390,
  left: 48,
  columnWidth: 164,
  headerHeight: 26,
  scheduleTop: 64,
  pixelsPerMinute: 2.12,
  start: toMinutes('15:00'),
  end: toMinutes('25:10'),
}

export const timetableHeight = timetableLayout.scheduleTop
  + (timetableLayout.end - timetableLayout.start) * timetableLayout.pixelsPerMinute + 20

type Rectangle = { kind: 'rect'; x: number; y: number; width: number; height: number; fill: string; shadow?: boolean }
type Circle = { kind: 'circle'; x: number; y: number; radius: number; fill: string }
type Label = { kind: 'text'; x: number; y: number; text: string; size: number; weight: number; fill: string; anchor: 'middle' | 'end' }
export type TimetableShape = Rectangle | Circle | Label

// 화면과 PDF가 같은 도형·좌표·텍스트를 사용합니다.
export function getTimetableShapes(): TimetableShape[] {
  const { left, columnWidth, headerHeight, scheduleTop, pixelsPerMinute, start, end } = timetableLayout
  const shapes: TimetableShape[] = []
  const liveBadges: TimetableShape[] = []
  stages.forEach((name, index) => {
    const x = left + index * columnWidth
    shapes.push({ kind: 'rect', x, y: 0, width: columnWidth, height: headerHeight, fill: index === 0 ? '#cddcff' : '#7d9dff' })
    shapes.push({ kind: 'text', x: x + columnWidth / 2, y: headerHeight / 2, text: name, size: 11, weight: 500, fill: '#111111', anchor: 'middle' })
  })
  for (let minute = start; minute <= end; minute += 60) {
    shapes.push({ kind: 'text', x: left - 12, y: scheduleTop + (minute - start) * pixelsPerMinute,
      text: `${Math.floor(minute / 60)}:00`, size: 10, weight: 500, fill: '#111111', anchor: 'end' })
  }
  for (const performance of performances) {
    const x = left + performance.stage * columnWidth
    const y = scheduleTop + (toMinutes(performance.start) - start) * pixelsPerMinute
    const duration = toMinutes(performance.end) - toMinutes(performance.start)
    const height = duration * pixelsPerMinute
    const centerX = x + columnWidth / 2
    const centerY = y + height / 2
    const fill = performance.highlight === 'light' ? '#cddcff' : performance.highlight === 'blue' ? '#7d9dff' : '#ebebeb'
    shapes.push({ kind: 'rect', x, y, width: columnWidth, height, fill, shadow: Boolean(performance.highlight) })
    shapes.push({ kind: 'text', x: centerX, y: centerY - 13, text: performance.name, size: performance.name.length > 20 ? 13 : 15, weight: 500, fill: '#111111', anchor: 'middle' })
    shapes.push({ kind: 'text', x: centerX, y: centerY + 5, text: `${performance.start}-${performance.end}`, size: 10, weight: 400, fill: '#333333', anchor: 'middle' })
    shapes.push({ kind: 'text', x: centerX, y: centerY + 19, text: `(${duration}분)`, size: 10, weight: 400, fill: '#333333', anchor: 'middle' })
    if (performance.isLive) {
      // 카드 오른쪽 위 모서리에 걸치되, 오른쪽 스테이지에서도 화면 안에 들어옵니다.
      const badgeX = x + columnWidth - 2
      const badgeY = y + 2
      liveBadges.push({ kind: 'circle', x: badgeX, y: badgeY, radius: 16, fill: '#ff2028' })
      liveBadges.push({ kind: 'text', x: badgeX, y: badgeY, text: 'LIVE', size: 11, weight: 700, fill: '#ffffff', anchor: 'middle' })
    }
  }
  return [...shapes, ...liveBadges]
}
