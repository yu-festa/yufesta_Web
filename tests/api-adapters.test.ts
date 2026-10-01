import assert from 'node:assert/strict'
import test from 'node:test'
import { toFestivalPlace, withPlaceDetail, placeCategoryLabels } from '../src/api/places.ts'
import type { ServerPlaceCategory } from '../src/api/places.ts'
import { getFilteredPlaces, mapCategories } from '../src/data/festivalMap.ts'
import { getPlacesByDistance } from '../src/utils/mapPlaces.ts'

test('서버 장소 목록과 상세를 지도 모델로 변환한다', () => {
  const place = toFestivalPlace({ id: 7, name: '메인 무대', category: 'STAGE', latitude: 35.83, longitude: 128.75 })
  assert.deepEqual(place.position, [35.83, 128.75])
  assert.equal(place.id, 'server-place-7')
  assert.equal(place.category, 'stage')

  const detail = withPlaceDetail(place, {
    id: 7, name: '메인 무대', category: 'STAGE', latitude: 35.83, longitude: 128.75,
    description: '축제 메인 무대', building: '천연잔디축구장', floor: null,
    events: [{ id: 1, name: '개막 공연', timeText: '18:00', sortOrder: 1 }],
  })
  assert.equal(detail.description, '축제 메인 무대')
  assert.equal(detail.building, '천연잔디축구장')
  assert.equal(detail.events?.[0]?.name, '개막 공연')
})

test('최신 장소 분류의 배달존을 지도 필터와 상세에 연결한다', () => {
  const delivery = toFestivalPlace({ id: 8, name: '정문 배달존', category: 'DELIVERY_ZONE', latitude: 35.831, longitude: 128.753 })
  const stage = toFestivalPlace({ id: 1, name: '무대', category: 'STAGE', latitude: 35.833, longitude: 128.753 })
  assert.equal(delivery.category, 'delivery')
  assert.equal(delivery.status, '배달존')
  assert.deepEqual(getFilteredPlaces('delivery', [stage, delivery]), [delivery])
  assert.deepEqual(mapCategories.map(category => category.id), ['all', 'stage', 'restroom', 'delivery', 'booth'])
  const detail = withPlaceDetail(delivery, { id: 8, name: '정문 배달존', category: 'DELIVERY_ZONE', latitude: 35.831, longitude: 128.753, description: '정문 앞에서 수령', building: null, floor: null, events: [{ id: 2, name: '배달 수령', timeText: '18:00~22:00', sortOrder: 1 }] })
  assert.equal(detail.status, '배달존')
  assert.equal(detail.events?.[0].name, '배달 수령')
})

test('푸드트럭은 서버 좌표·운영 시간을 유지하고 별도 필터로 조회한다', () => {
  const source = { id: 9, name: '커피차·푸드트럭', category: 'BOOTH' as const, latitude: 35.8348, longitude: 128.7553 }
  const booth = toFestivalPlace(source)
  const stage = toFestivalPlace({ ...source, id: 1, name: '공연장', category: 'STAGE' })
  assert.equal(booth.category, 'booth')
  assert.equal(booth.status, '푸드트럭')
  assert.equal(placeCategoryLabels.BOOTH, '푸드트럭')
  assert.deepEqual(booth.position, [source.latitude, source.longitude])
  assert.deepEqual(getFilteredPlaces('booth', [stage, booth]), [booth])
  assert.deepEqual(getFilteredPlaces('all', [stage, booth]), [stage, booth])
  const events = [{ id: 3, name: '운영 시간', timeText: '15:00~22:00', sortOrder: 0 }]
  const detail = withPlaceDetail(booth, { ...source, latitude: 35.8349, description: '무대 반대편', building: null, floor: null, events })
  assert.equal(detail.name, source.name)
  assert.equal(detail.category, 'booth')
  assert.equal(detail.status, '푸드트럭')
  assert.deepEqual(detail.position, [35.8349, source.longitude])
  assert.deepEqual(detail.events, events)
})

test('알 수 없는 서버 카테고리는 기타 장소로 보존하며 기존 필터에 섞지 않는다', () => {
  for (const category of ['INFORMATION', '', '__proto__', 'constructor']) {
    const source = { id: 10, name: '새 장소', category: category as ServerPlaceCategory, latitude: 35.834, longitude: 128.753 }
    const place = toFestivalPlace(source)
    const detail = withPlaceDetail(place, { ...source, description: '새 안내', building: null, floor: null, events: [] })
    for (const item of [place, detail]) {
      assert.equal(item.category, 'other')
      assert.equal(item.status, '기타 장소')
      assert.deepEqual(getFilteredPlaces('all', [item]), [item])
      for (const filter of ['stage', 'restroom', 'delivery', 'booth'] as const) assert.deepEqual(getFilteredPlaces(filter, [item]), [])
    }
  }
})

test('현재 위치가 있으면 가까운 장소순, 없으면 서버 순서를 유지한다', () => {
  const far = toFestivalPlace({ id: 1, name: '먼 무대', category: 'STAGE', latitude: 35.839, longitude: 128.753 })
  const near = toFestivalPlace({ id: 2, name: '가까운 배달존', category: 'DELIVERY_ZONE', latitude: 35.831, longitude: 128.753 })
  const source = [far, near]
  assert.deepEqual(getPlacesByDistance(source, null).map(entry => entry.place.id), [far.id, near.id])
  const sorted = getPlacesByDistance(source, [35.8309, 128.753])
  assert.deepEqual(sorted.map(entry => entry.place.id), [near.id, far.id])
  assert.ok(sorted[0].distance! < sorted[1].distance!)
  assert.deepEqual(source, [far, near])
})
