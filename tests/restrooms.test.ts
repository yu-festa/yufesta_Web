import assert from 'node:assert/strict'
import test from 'node:test'
import { filterRestroomLocations, floorLabel, getRestroomBuilding, getRestroomFloors, restroomBuildings, restroomDetailLevel, restroomSources, unverifiedRestroomBuildings } from '../src/data/restrooms.ts'
import { getFilteredPlaces } from '../src/data/festivalMap.ts'
import { distanceInMeters, getNearbyRestrooms } from '../src/utils/mapPlaces.ts'

test('공식 도면에서 확인된 19개 실내 위치는 원본 도면과 연결된다', () => {
  const locations = restroomBuildings.flatMap(building => building.locations)
  assert.equal(new Set(locations.map(location => location.id)).size, locations.length)
  const detailed = locations.filter(location => location.directions !== null)
  assert.equal(detailed.length, 19)
  for (const location of locations) {
    assert.ok(restroomSources[location.source])
    assert.ok(Number.isInteger(location.floor) && location.floor !== 0)
    if (location.directions) {
      assert.ok(location.planUrl)
      assert.equal(new URL(location.planUrl).host, 'libs.yu.ac.kr')
    }
  }
})

test('중앙도서관의 같은 층 다른 위치와 확인되지 않은 층을 구분한다', () => {
  const central = getRestroomBuilding('central-library-restroom')!
  assert.deepEqual(getRestroomFloors(central), [-1, 1, 2, 3, 5])
  const firstFloor = filterRestroomLocations(central, 1, 'all')
  assert.equal(firstFloor.length, 4)
  assert.equal(new Set(firstFloor.map(location => location.directions)).size, 2)
  assert.equal(filterRestroomLocations(central, 1, 'male').length, 2)
  assert.deepEqual(filterRestroomLocations(central, 4, 'all'), [])
  assert.deepEqual(filterRestroomLocations(central, 5, 'male'), [])
  assert.equal(filterRestroomLocations(central, 5, 'female').length, 1)
  // 1층 장애인 화장실의 실내 위치는 미확인: 특정 화장실에 임의로 지정하지 않는다.
  assert.ok(firstFloor.every(location => !location.accessible))
  assert.ok(central.notes?.some(note => note.source === 'accessibility'))
})

test('층별·남녀 필터는 확인된 항목만 반환하며 미확인 성별을 남녀로 추정하지 않는다', () => {
  const science = getRestroomBuilding('science-library-restroom')!
  assert.equal(filterRestroomLocations(science, 'all', 'all').length, 8)
  assert.equal(filterRestroomLocations(science, 'all', 'female').length, 4)
  assert.equal(filterRestroomLocations(science, 2, 'male').length, 1)
  const support = getRestroomBuilding('student-support-restroom')!
  assert.equal(filterRestroomLocations(support, 1, 'unspecified').length, 1)
  assert.deepEqual(filterRestroomLocations(support, 1, 'female'), [])
  assert.equal(floorLabel(-1), '지하 1층')
  assert.equal(floorLabel(3), '3층')
})

test('건물 대표 핀과 상세 안내를 일대일로 연결하고 미확인 건물에 화장실 핀을 만들지 않는다', () => {
  const pins = getFilteredPlaces('restroom')
  assert.equal(pins.length, restroomBuildings.length)
  for (const building of restroomBuildings) {
    const pin = pins.find(place => place.id === building.id)!
    assert.deepEqual(pin.position, building.position)
    assert.equal(pin.status, restroomDetailLevel(building))
  }
  for (const building of unverifiedRestroomBuildings) {
    assert.ok(pins.every(pin => !pin.name.includes(building.name)))
  }
  assert.equal(getRestroomBuilding('not-a-building'), undefined)
  assert.equal(getRestroomBuilding(null), undefined)
})

test('층만 알려진 시설과 건물만 알려진 시설에 실내 위치를 채우지 않는다', () => {
  for (const id of ['student-support-restroom', 'venture-restroom', 'art-center-restroom', 'chemical-building-restroom']) {
    const building = getRestroomBuilding(id)!
    assert.equal(restroomDetailLevel(building), '층 정보 확인')
    assert.ok(building.locations.every(location => location.directions === null && !location.planUrl))
  }
  for (const id of ['student-center-restroom', 'museum-restroom']) {
    const building = getRestroomBuilding(id)!
    assert.equal(restroomDetailLevel(building), '건물만 확인')
    assert.deepEqual(building.locations, [])
  }
})

test('직선 거리는 미터 단위로 계산하며 같은 지점과 좌표 순서를 처리한다', () => {
  assert.equal(distanceInMeters([35.83, 128.75], [35.83, 128.75]), 0)
  assert.ok(Math.abs(distanceInMeters([0, 0], [0, 1]) - 111_195) < 1)
  assert.ok(Math.abs(distanceInMeters([60, 0], [60, 1]) - 55_597) < 1)
  assert.equal(distanceInMeters([35.83, 128.75], [35.84, 128.76]), distanceInMeters([35.84, 128.76], [35.83, 128.75]))
})

test('공연장 주변 500m의 확인된 화장실만 가까운 순서로 제공한다', () => {
  const stage = getFilteredPlaces('stage').find(place => place.id === 'main-stage')!
  const nearby = getNearbyRestrooms(stage)
  assert.equal(nearby[0].place.id, 'student-support-restroom')
  assert.ok(nearby[0].distance > 120 && nearby[0].distance < 140)
  assert.ok(nearby.every(({ place, distance }, index) => place.category === 'restroom'
    && distance <= 500 && (index === 0 || distance >= nearby[index - 1].distance)))
  assert.ok(!nearby.some(({ place }) => place.id === 'science-library-restroom'))
  assert.deepEqual(getNearbyRestrooms(stage, 100), [])
  assert.deepEqual(getNearbyRestrooms(nearby[0].place), [])
})
