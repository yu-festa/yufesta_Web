export const restroomCheckedAt = '2026-09-16'

export const restroomSources = {
  campus: { label: '영남대학교 공식 캠퍼스맵', url: 'https://www.yu.ac.kr/main/intro/campus-map.do' },
  restroom: { label: '영대신문 · 교내 화장실 안내', url: 'https://yumedia.yu.ac.kr/news/articleView.html?idxno=23152' },
  centralLibrary: { label: '중앙도서관 층별 시설안내', url: 'https://libs.yu.ac.kr/webcontent/info/9' },
  scienceLibrary: { label: '이종우과학도서관 층별 시설안내', url: 'https://libs.yu.ac.kr/webcontent/info/61' },
  accessibility: { label: '장애학생지원센터 · 편의시설', url: 'https://www.yu.ac.kr/jangae/facility/facilities.do' },
  museum: { label: '한국관광공사 · 박물관 편의시설', url: 'https://access.visitkorea.or.kr/ms/detail.do?cotId=811d4553-f6db-491a-8c35-83d37c557e18' },
} as const

type RestroomSource = keyof typeof restroomSources
export type RestroomGender = 'male' | 'female' | 'unspecified'

export interface RestroomLocation {
  id: string
  floor: number
  gender: RestroomGender
  accessible?: true
  /** 도면에 표시된 주변 시설. 확인되지 않은 호실·방향은 만들지 않습니다. */
  directions: string | null
  source: RestroomSource
  planUrl?: string
}

export interface RestroomBuilding {
  id: string
  name: string
  code: string
  position: [latitude: number, longitude: number]
  source: RestroomSource
  summary: string
  locations: RestroomLocation[]
  coverage: string
  notes?: { text: string; source: RestroomSource }[]
}

const planRoot = 'https://libs.yu.ac.kr/image/ko/local/guide/'

function pair(id: string, floor: number, directions: string | null, source: RestroomSource, planFile?: string): RestroomLocation[] {
  return (['male', 'female'] as const).map(gender => ({
    id: `${id}-${gender}`, floor, gender, directions, source,
    ...(planFile ? { planUrl: `${planRoot}${planFile}.jpg` } : {}),
  }))
}

// 핀은 공식 캠퍼스맵의 건물 대표 좌표입니다. 아래 목록은 공개 자료에서 확인한 일부 시설이며,
// 건물의 모든 화장실이나 축제 당일 개방을 보장하지 않습니다. 조사 근거: docs/restroom-sources.md
export const restroomBuildings: RestroomBuilding[] = [
  {
    id: 'central-library-restroom', name: '중앙도서관', code: 'B04',
    position: [35.83302138097258, 128.75796519012056], source: 'centralLibrary',
    summary: '지하 1층·1층·2층·3층·5층의 화장실 위치를 공식 도면에서 확인했어요.',
    locations: [
      ...pair('central-b1-lobby', -1, '중앙 엘리베이터 옆, ACE ZONE과 제2열람실 사이 로비', 'centralLibrary', 'centerB1F'),
      ...pair('central-1-lobby', 1, '출입구 쪽 로비, 안내데스크·열람사무실 옆', 'centralLibrary', 'center1F'),
      ...pair('central-1-digital', 1, '디지털자료실 안쪽, 정보이용교육실 쪽 계단 옆', 'centralLibrary', 'center1F'),
      ...pair('central-2', 2, '인문예술자료실(북편) 앞, 중앙 계단·엘리베이터 옆', 'centralLibrary', 'center2F'),
      ...pair('central-3', 3, '사회과학자료실(북편) 앞, 중앙 계단·엘리베이터 옆', 'centralLibrary', 'center3F'),
      { id: 'central-5-female', floor: 5, gender: 'female', directions: '고문헌서고와 고문헌사무실 사이, 엘리베이터 옆', source: 'centralLibrary', planUrl: `${planRoot}center5F.jpg` },
    ],
    coverage: '4층 도면에는 화장실 위치가 표시되어 있지 않아요. 5층은 여자 화장실만 표시되어 있으며, 6층 이상은 위치를 확인하지 못했어요. 미표시가 화장실이 없다는 뜻은 아니에요.',
    notes: [{ text: '1층 남자 장애인 화장실은 장애학생지원센터 자료에서 확인했어요. 1층의 두 남자 화장실 중 어느 곳인지는 확인되지 않았어요.', source: 'accessibility' }],
  },
  {
    id: 'science-library-restroom', name: '이종우과학도서관', code: 'F24',
    position: [35.82908934416802, 128.75663910728065], source: 'scienceLibrary',
    summary: '1~4층 남녀 화장실과 주변 시설을 공식 도면에서 확인했어요.',
    locations: [
      { id: 'science-1-male', floor: 1, gender: 'male', directions: '과학기술자료실 출입구 옆 계단 쪽', source: 'scienceLibrary', planUrl: `${planRoot}science1F.jpg` },
      { id: 'science-1-female', floor: 1, gender: 'female', directions: '과학기술서고2 옆 복도, 엘리베이터 쪽', source: 'scienceLibrary', planUrl: `${planRoot}science1F.jpg` },
      { id: 'science-2-male', floor: 2, gender: 'male', directions: '휴게실 옆 계단 쪽', source: 'scienceLibrary', planUrl: `${planRoot}science2F.jpg` },
      { id: 'science-2-female', floor: 2, gender: 'female', directions: '제1열람실 입구 옆', source: 'scienceLibrary', planUrl: `${planRoot}science2F.jpg` },
      { id: 'science-3-male', floor: 3, gender: 'male', directions: '복사실 옆 계단 쪽', source: 'scienceLibrary', planUrl: `${planRoot}science3F.jpg` },
      { id: 'science-3-female', floor: 3, gender: 'female', directions: '제2열람실 입구 옆', source: 'scienceLibrary', planUrl: `${planRoot}science3F.jpg` },
      { id: 'science-4-male', floor: 4, gender: 'male', directions: '그룹스터디룸 ④~⑤ 쪽 계단 옆', source: 'scienceLibrary', planUrl: `${planRoot}science4F.jpg` },
      { id: 'science-4-female', floor: 4, gender: 'female', directions: '제3열람실 입구 옆', source: 'scienceLibrary', planUrl: `${planRoot}science4F.jpg` },
    ],
    coverage: '공식 1~4층 도면에 표시된 위치예요. 호실 번호와 장애인 화장실 여부는 도면에서 확인되지 않았어요.',
  },
  {
    id: 'student-support-restroom', name: '학생지원센터', code: 'A05',
    position: [35.83525641145394, 128.75610003620042], source: 'campus',
    summary: '공식 캠퍼스맵에 1층 장애인 화장실이 안내되어 있어요.',
    locations: [{ id: 'support-1-accessible', floor: 1, gender: 'unspecified', accessible: true, directions: null, source: 'campus' }],
    coverage: '1층 장애인 화장실의 존재만 확인했어요. 남녀 구분, 가까운 호실과 다른 층의 위치는 미확인이에요.',
  },
  {
    id: 'venture-restroom', name: '벤처창업관', code: 'A16',
    position: [35.8380137959199, 128.756122310121], source: 'campus',
    summary: '공식 캠퍼스맵에 1·2층 남녀 화장실이 안내되어 있어요.',
    locations: [...pair('venture-1', 1, null, 'campus'), ...pair('venture-2', 2, null, 'campus')],
    coverage: '층과 남녀 구분만 확인했어요. 층 내부 위치와 가까운 호실은 미확인이에요.',
  },
  {
    id: 'art-center-restroom', name: '천마아트센터', code: 'E02',
    position: [35.83206441830065, 128.75315255201326], source: 'campus',
    summary: '공식 캠퍼스맵에 1층 장애인 화장실이 안내되어 있어요.',
    locations: [{ id: 'art-1-accessible', floor: 1, gender: 'unspecified', accessible: true, directions: null, source: 'campus' }],
    coverage: '1층 장애인 화장실의 존재만 확인했어요. 세부 동, 남녀 구분과 가까운 호실은 미확인이에요.',
  },
  {
    id: 'chemical-building-restroom', name: '화공관', code: 'E24',
    position: [35.828932187903234, 128.7541348536551], source: 'campus',
    summary: '공식 캠퍼스맵의 3층 시설 목록에 화장실이 안내되어 있어요.',
    locations: [{ id: 'chemical-3', floor: 3, gender: 'unspecified', directions: null, source: 'campus' }],
    coverage: '3층 화장실의 존재만 확인했어요. 남녀 구분, 가까운 호실과 다른 층의 위치는 미확인이에요.',
  },
  {
    id: 'student-center-restroom', name: '학생회관', code: 'B06',
    position: [35.83420608297126, 128.75675192043371], source: 'restroom',
    summary: '교내 기사에서 화장실이 있는 건물임을 확인했어요. 층과 호실은 미확인이에요.',
    locations: [],
    coverage: '공개 자료에 화장실의 층·남녀 구분·호실 앞 위치가 나와 있지 않아 건물 위치만 안내해요.',
  },
  {
    id: 'museum-restroom', name: '박물관', code: 'A04',
    position: [35.83647855390543, 128.75633170708156], source: 'museum',
    summary: '한국관광공사 안내에서 장애인 전용 화장실의 존재를 확인했어요. 층은 미확인이에요.',
    locations: [],
    coverage: '장애인 전용 화장실의 층·남녀 구분·실내 위치는 공개 안내에 없어요.',
  },
]

// 건물 자체의 위치만 확인된 조사 대상. 화장실 핀이나 추정 층별 항목으로 만들지 않습니다.
export const unverifiedRestroomBuildings = [
  { name: '상경관', code: 'B02' },
  { name: '사회과학관', code: 'B05' },
  { name: '디자인관', code: 'A06' },
  { name: '국제교류센터', code: 'A02' },
] as const

export function getRestroomBuilding(id: string | null) {
  return restroomBuildings.find(building => building.id === id)
}

export function floorLabel(floor: number) {
  return floor < 0 ? `지하 ${Math.abs(floor)}층` : `${floor}층`
}

export function getRestroomFloors(building: RestroomBuilding) {
  return [...new Set(building.locations.map(location => location.floor))].sort((a, b) => a - b)
}

export function filterRestroomLocations(building: RestroomBuilding, floor: number | 'all', gender: RestroomGender | 'all') {
  return building.locations.filter(location => (floor === 'all' || location.floor === floor)
    && (gender === 'all' || location.gender === gender))
}

export function restroomDetailLevel(building: RestroomBuilding) {
  if (building.locations.some(location => location.directions)) return '실내 위치 확인'
  return building.locations.length ? '층 정보 확인' : '건물만 확인'
}
