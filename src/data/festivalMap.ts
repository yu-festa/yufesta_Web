import { restroomBuildings, restroomDetailLevel, restroomSources } from './restrooms.ts'

export type PlaceCategory = 'stage' | 'restroom' | 'delivery'
export type MapFilter = 'all' | PlaceCategory
export type Coordinates = [latitude: number, longitude: number]

export const mapCategories = [
  { id: 'all', label: '전체', icon: '' },
  { id: 'stage', label: '공연장', icon: '🎤' },
  { id: 'restroom', label: '화장실', icon: '🚻' },
  { id: 'delivery', label: '배달존', icon: '🛵' },
] as const

export const mapSources = {
  ...restroomSources,
  festival: { label: '영대신문 · 2025 천마대동제', url: 'https://yumedia.yu.ac.kr/news/articleView.html?idxno=23455' },
} as const

export interface FestivalPlace {
  id: string
  category: PlaceCategory
  name: string
  position: Coordinates
  status: string
  description: string
  source?: keyof typeof mapSources
  serverId?: number
  building?: string | null
  floor?: string | null
  events?: { id: number; name: string; timeText: string; sortOrder: number }[]
}

export const campusCenter: Coordinates = [35.8337, 128.7558]

// 좌표는 공식 캠퍼스맵의 건물/시설 대표 좌표입니다. 출입구나 무대의 정확한 좌표가 아닙니다.
// 확인한 행사는 2025.05.26~28 천마대동제이며, 가을축제 또는 올해 배치도로 취급하지 않습니다.
// 배달존과 임시 화장실은 근거 자료를 확인하기 전까지 임의의 핀을 추가하지 않습니다.
export const festivalPlaces: FestivalPlace[] = [
  {
    id: 'main-stage', category: 'stage', name: '천연잔디축구장',
    position: [35.835771105303024, 128.75479448159237],
    status: '2025년 5월 공연장',
    description: '2025 천마대동제 메인 공연이 열린 장소예요. 올해 공연장과 입구는 추후 공지를 확인해 주세요.',
    source: 'festival',
  },
  {
    id: 'busking-stage', category: 'stage', name: '천마로 시계탑 일대',
    position: [35.83445264947151, 128.7537528824254],
    status: '2025년 5월 버스킹 구역',
    description: '2025 천마대동제 버스킹이 진행된 시계탑 인근 구역이에요. 핀은 시계탑의 대표 위치를 표시해요.',
    source: 'festival',
  },
  ...restroomBuildings.map(building => ({
    id: building.id, category: 'restroom' as const, name: `${building.name} 화장실`,
    position: building.position, status: restroomDetailLevel(building),
    description: building.summary, source: building.source,
  })),
]

export function getFilteredPlaces(filter: MapFilter, source: FestivalPlace[] = festivalPlaces): FestivalPlace[] {
  return filter === 'all' ? source : source.filter(place => place.category === filter)
}
