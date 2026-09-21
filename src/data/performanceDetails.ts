import countdownPoster from '../assets/Main/TimeTableDemo.svg'

export type PerformanceDetail = {
  id: string
  title: string
  poster: string
  date: string
  venue: string
  duration: string
  lineup: string[]
}

// 기존 메인 카드와 첨부된 상세 화면의 예시 데이터입니다. 실제 공연 API 연동 시 교체합니다.
export const performanceDetails: PerformanceDetail[] = Array.from({ length: 3 }, (_, index) => ({
  id: `demo-${index}`,
  title: 'COUNTDOWN FANTASY 2025-2026',
  poster: countdownPoster,
  date: '2025.12.30 - 2025.12.31',
  venue: '일산 킨텍스',
  duration: '120분',
  lineup: ['심아일랜드', 'CNBLUE', '극동아시아 타이거즈', 'ADOY', '유령서점'],
}))
