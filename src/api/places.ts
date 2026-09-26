import { apiRequest } from './client.ts'
import type { FestivalPlace, PlaceCategory } from '../data/festivalMap.ts'

export type ServerPlaceCategory = 'STAGE' | 'TOILET' | 'DELIVERY_ZONE'

export type PlaceListItem = {
  id: number
  name: string
  category: ServerPlaceCategory
  latitude: number
  longitude: number
}

export type PlaceEvent = {
  id: number
  name: string
  timeText: string
  sortOrder: number
}

export type PlaceDetail = PlaceListItem & {
  description: string | null
  building: string | null
  floor: string | null
  events: PlaceEvent[]
}

export function getPlaces(category?: ServerPlaceCategory) {
  const query = category ? `?${new URLSearchParams({ category })}` : ''
  return apiRequest<PlaceListItem[]>(`/api/v1/places${query}`)
}

export function getPlace(placeId: number) {
  return apiRequest<PlaceDetail>(`/api/v1/places/${placeId}`)
}

const categoryMap: Record<ServerPlaceCategory, PlaceCategory> = {
  STAGE: 'stage', TOILET: 'restroom', DELIVERY_ZONE: 'delivery',
}

export const placeCategoryLabels: Record<ServerPlaceCategory, string> = {
  STAGE: '공연장', TOILET: '화장실', DELIVERY_ZONE: '배달존',
}

export function toFestivalPlace(place: PlaceListItem): FestivalPlace {
  return {
    id: `server-place-${place.id}`,
    serverId: place.id,
    category: categoryMap[place.category],
    name: place.name,
    position: [Number(place.latitude), Number(place.longitude)],
    status: placeCategoryLabels[place.category],
    description: '장소를 선택하면 상세 안내를 불러옵니다.',
  }
}

export function withPlaceDetail(place: FestivalPlace, detail: PlaceDetail): FestivalPlace {
  return {
    ...place,
    name: detail.name,
    category: categoryMap[detail.category],
    status: placeCategoryLabels[detail.category],
    position: [Number(detail.latitude), Number(detail.longitude)],
    description: detail.description || '등록된 상세 설명이 없습니다.',
    building: detail.building,
    floor: detail.floor,
    events: detail.events,
  }
}
