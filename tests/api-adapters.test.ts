import assert from 'node:assert/strict'
import test from 'node:test'
import { toFestivalPlace, withPlaceDetail } from '../src/api/places.ts'

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
