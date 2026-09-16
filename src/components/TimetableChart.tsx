import { useId } from 'react'
import { festivalTitle, getTimetableShapes, performances, timetableHeight, timetableLayout } from '../data/timetable'

const shapes = getTimetableShapes()

export default function TimetableChart() {
  const id = useId()
  return (
    <svg className="block h-auto w-full" viewBox={`0 0 ${timetableLayout.width} ${timetableHeight}`} role="img" aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>{festivalTitle} 타임테이블</title>
      <desc id={`${id}-description`}>
        {performances.map(performance => `${performance.stage + 1}번 스테이지, ${performance.name}${performance.isLive ? ', 현재 라이브 공연 중' : ''}, ${performance.start}부터 ${performance.end}까지`).join('. ')}
      </desc>
      <defs>
        <filter id={`${id}-shadow`} x="-10%" y="-10%" width="125%" height="135%">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.2" />
        </filter>
      </defs>
      {shapes.map((shape, index) => shape.kind === 'rect'
        ? <rect key={index} x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={shape.fill} filter={shape.shadow ? `url(#${id}-shadow)` : undefined} />
        : shape.kind === 'circle'
        ? <circle key={index} cx={shape.x} cy={shape.y} r={shape.radius} fill={shape.fill} />
        : <text key={index} x={shape.x} y={shape.y} fill={shape.fill} fontFamily="Pretendard, sans-serif" fontSize={shape.size} fontWeight={shape.weight} textAnchor={shape.anchor} dominantBaseline="central">{shape.text}</text>,
      )}
    </svg>
  )
}
