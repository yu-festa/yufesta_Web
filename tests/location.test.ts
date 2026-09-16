import assert from 'node:assert/strict'
import test from 'node:test'
import { watchCurrentLocation } from '../src/utils/location.ts'
import type { LocationState } from '../src/utils/location.ts'
import { getFilteredPlaces } from '../src/data/festivalMap.ts'

function createGeolocation() {
  let success: PositionCallback
  let failure: PositionErrorCallback
  const cleared: number[] = []
  let options: PositionOptions | undefined
  const api = {
    watchPosition(onSuccess: PositionCallback, onError: PositionErrorCallback, config: PositionOptions) {
      success = onSuccess
      failure = onError
      options = config
      return 7
    },
    clearWatch(id: number) { cleared.push(id) },
  }
  return {
    api, cleared, get options() { return options },
    position(latitude = 35.834, longitude = 128.755, accuracy = 12) {
      success({ coords: { latitude, longitude, accuracy } } as GeolocationPosition)
    },
    error(code: number) { failure({ code } as GeolocationPositionError) },
  }
}

test('위치 변경을 전달하고 해제 후 도착한 콜백을 무시한다', () => {
  const geo = createGeolocation()
  const states: LocationState[] = []
  const stop = watchCurrentLocation(geo.api, true, state => states.push(state))
  assert.equal(states[0].status, 'loading')
  assert.equal(geo.options?.enableHighAccuracy, true)
  assert.equal(geo.options?.timeout, 15000)
  geo.position()
  geo.position(35.835, 128.756, 5)
  assert.deepEqual(states.at(-1)?.position, { latitude: 35.835, longitude: 128.756, accuracy: 5 })
  stop()
  stop()
  geo.position()
  assert.equal(states.length, 3)
  assert.deepEqual(geo.cleared, [7])
})

for (const [code, message] of [[1, '위치 권한'], [2, '위치 기능'], [3, '시간이 걸리고']] as const) {
  test(`위치 오류 ${code}를 안내하고 구독을 해제한다`, () => {
    const geo = createGeolocation()
    const states: LocationState[] = []
    watchCurrentLocation(geo.api, true, state => states.push(state))
    geo.position()
    geo.error(code)
    const error = states.at(-1)!
    assert.equal(error.status, 'error')
    assert.equal(error.position, null)
    assert.ok(error.message.includes(message))
    assert.deepEqual(geo.cleared, [7])
    geo.position()
    assert.equal(states.at(-1), error)
  })
}

test('지원되지 않는 환경에서는 위치를 요청하지 않는다', () => {
  const states: LocationState[] = []
  watchCurrentLocation(undefined, true, state => states.push(state))
  assert.equal(states[0].status, 'error')
  assert.ok(states[0].message.includes('지원하지'))
  watchCurrentLocation({ watchPosition() { throw new Error('호출되면 안 됨') }, clearWatch() {} }, false, state => states.push(state))
  assert.ok(states[1].message.includes('HTTPS'))
})

test('유효하지 않은 좌표는 현재 위치로 표시하지 않는다', () => {
  const geo = createGeolocation()
  const states: LocationState[] = []
  watchCurrentLocation(geo.api, true, state => states.push(state))
  geo.position(NaN, 128.755, 10)
  assert.equal(states.at(-1)?.status, 'error')
  assert.equal(states.at(-1)?.position, null)
  assert.deepEqual(geo.cleared, [7])
})

test('동기 오류와 예외가 발생해도 위치 구독을 남기지 않는다', () => {
  const cleared: number[] = []
  const states: LocationState[] = []
  watchCurrentLocation({
    watchPosition(_success, failure) { failure?.({ code: 1 } as GeolocationPositionError); return 9 },
    clearWatch(id) { cleared.push(id) },
  }, true, state => states.push(state))
  assert.deepEqual(cleared, [9])
  watchCurrentLocation({ watchPosition() { throw new Error('Unavailable') }, clearWatch() {} }, true, state => states.push(state))
  assert.equal(states.at(-1)?.status, 'error')
})

test('장소 필터는 해당 장소만 반환하고 미확인 배달존은 만들지 않는다', () => {
  const all = getFilteredPlaces('all')
  assert.ok(all.length > 0)
  assert.equal(new Set(all.map(place => place.id)).size, all.length)
  for (const category of ['stage', 'restroom', 'delivery'] as const) {
    assert.deepEqual(getFilteredPlaces(category), all.filter(place => place.category === category))
  }
  assert.equal(getFilteredPlaces('delivery').length, 0)
  assert.ok(all.every(place => place.position[0] > 35.82 && place.position[0] < 35.84
    && place.position[1] > 128.74 && place.position[1] < 128.77))
})
