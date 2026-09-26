import { festivalPlaces } from '../data/festivalMap.ts'
import type { Coordinates, FestivalPlace } from '../data/festivalMap.ts'

// 건물 대표 좌표 사이의 직선 거리입니다. 실제 보행 거리나 실내 이동 거리가 아닙니다.
export function distanceInMeters(from: Coordinates, to: Coordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = radians(to[0] - from[0])
  const longitudeDelta = radians(to[1] - from[1])
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from[0])) * Math.cos(radians(to[0])) * Math.sin(longitudeDelta / 2) ** 2
  return 6_371_000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))))
}

export function getNearbyRestrooms(stage: FestivalPlace, radius = 500, source: FestivalPlace[] = festivalPlaces) {
  if (stage.category !== 'stage') return []
  return source
    .filter(place => place.category === 'restroom')
    .map(place => ({ place, distance: distanceInMeters(stage.position, place.position) }))
    .filter(({ distance }) => distance <= radius)
    .sort((a, b) => a.distance - b.distance)
}

export function formatMapDistance(meters: number) {
  return meters >= 1000 ? `약 ${(meters / 1000).toFixed(1)}km` : `약 ${Math.round(meters / 10) * 10}m`
}

export function getPlacesByDistance(source: FestivalPlace[], position: Coordinates | null) {
  const entries = source.map(place => ({ place, distance: position ? distanceInMeters(position, place.position) : null }))
  return position ? entries.sort((a, b) => a.distance! - b.distance!) : entries
}
