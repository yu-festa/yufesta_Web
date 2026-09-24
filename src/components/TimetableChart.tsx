import { useId, useMemo } from 'react'
import type { TimetableSlot } from '../api/timetable'
import { buildTimetable, festivalTitle } from '../data/timetable'

export default function TimetableChart({ slots }: { slots: TimetableSlot[] }) {
  const id = useId()
  const { layout, shapes } = useMemo(() => buildTimetable(slots), [slots])
  return <div className="overflow-x-auto"><svg className="block h-auto w-full" style={{ minWidth: layout.width }} viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-labelledby={`${id}-title ${id}-description`}>
    <title id={`${id}-title`}>{festivalTitle} 타임테이블</title>
    <desc id={`${id}-description`}>{slots.map(slot => `${slot.stage?.name ?? '장소 미정'}, ${slot.title}${slot.isLive ? ', 현재 라이브 공연 중' : ''}${slot.isChanged ? ', 변경된 일정' : ''}, ${slot.effectiveStartAt}부터 ${slot.effectiveEndAt}까지`).join('. ')}</desc>
    <defs><filter id={`${id}-shadow`} x="-10%" y="-10%" width="125%" height="135%"><feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.2" /></filter></defs>
    {shapes.map((shape, index) => shape.kind === 'rect'
      ? <rect key={index} x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={shape.fill} filter={shape.shadow ? `url(#${id}-shadow)` : undefined} />
      : shape.kind === 'circle'
      ? <circle key={index} cx={shape.x} cy={shape.y} r={shape.radius} fill={shape.fill} />
      : <text key={index} x={shape.x} y={shape.y} fill={shape.fill} fontFamily="Pretendard, sans-serif" fontSize={shape.size} fontWeight={shape.weight} textAnchor={shape.anchor} dominantBaseline="central">{shape.text}</text>)}
  </svg></div>
}
