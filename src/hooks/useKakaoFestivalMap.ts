import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { campusCenter, mapCategories } from '../data/festivalMap'
import type { FestivalPlace } from '../data/festivalMap'
import type { UserPosition } from '../utils/location'
import { loadKakaoMaps } from '../utils/kakaoMaps'
import type { KakaoMap, KakaoMaps } from '../utils/kakaoMaps'

function fitPlaces(maps: KakaoMaps, map: KakaoMap, places: FestivalPlace[]) {
  if (!places.length) {
    map.setLevel(4)
    map.setCenter(new maps.LatLng(...campusCenter))
    return
  }
  const bounds = new maps.LatLngBounds()
  for (const place of places) bounds.extend(new maps.LatLng(...place.position))
  map.setBounds(bounds, 140, 40, 220, 40)
  if (map.getLevel() < 3) map.setLevel(3)
}

export function useKakaoFestivalMap(containerRef: RefObject<HTMLDivElement | null>, places: FestivalPlace[], selected: FestivalPlace | undefined, position: UserPosition | null, onSelect: (id: string | null) => void) {
  const [instance, setInstance] = useState<{ maps: KakaoMaps; map: KakaoMap } | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const centerNextFix = useRef(false)
  const focusedSelection = useRef<{ map: KakaoMap; id: string | undefined } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    let dispose: (() => void) | undefined
    setInstance(null)
    setError(false)
    void loadKakaoMaps().then(maps => {
      if (cancelled) return
      const map = new maps.Map(container, { center: new maps.LatLng(...campusCenter), level: 4 })
      const clearSelection = () => onSelect(null)
      maps.event.addListener(map, 'click', clearSelection)
      const observer = new ResizeObserver(() => {
        const center = map.getCenter()
        map.relayout()
        map.setCenter(center)
      })
      observer.observe(container)
      setInstance({ maps, map })
      dispose = () => {
        observer.disconnect()
        maps.event.removeListener(map, 'click', clearSelection)
        container.replaceChildren()
      }
    }).catch(error => {
      if (!cancelled) {
        console.error('Kakao Maps initialization failed:', error)
        setError(true)
      }
    })
    return () => { cancelled = true; dispose?.() }
  }, [containerRef, attempt, onSelect])

  useEffect(() => {
    if (!instance) return
    const { maps, map } = instance
    const overlays = places.map(place => {
      const category = mapCategories.find(item => item.id === place.category)!
      const content = document.createElement('button')
      content.type = 'button'
      content.className = `festival-marker grid size-11 cursor-pointer place-items-center rounded-full border-2 bg-white shadow-[0_3px_8px_#24375240] ${place.category === 'restroom' ? 'border-[#75a7e7]' : place.category === 'delivery' || place.category === 'amenity' || place.category === 'info' ? 'border-[#596579]' : 'border-[#ef7276]'}`
      content.title = place.name
      content.setAttribute('aria-label', `${place.name} · ${place.status}`)
      const icon = document.createElement('span')
      icon.className = 'festival-marker-content block text-[23px] leading-none'
      icon.setAttribute('aria-hidden', 'true')
      icon.textContent = category.icon
      content.append(icon)
      content.onclick = () => onSelect(place.id)
      const overlay = new maps.CustomOverlay({ map, position: new maps.LatLng(...place.position), content, xAnchor: .5, yAnchor: .5, clickable: true })
      return { overlay, content }
    })
    fitPlaces(maps, map, places)
    return () => { overlays.forEach(({ overlay, content }) => { content.onclick = null; overlay.setMap(null) }) }
  }, [instance, places, onSelect])

  useEffect(() => {
    if (!instance || !position) return
    const { maps, map } = instance
    const center = new maps.LatLng(position.latitude, position.longitude)
    const accuracy = new maps.Circle({ map, center, radius: position.accuracy, strokeWeight: 1, strokeColor: '#2674ff', strokeOpacity: .3, fillColor: '#2674ff', fillOpacity: .12 })
    const dot = document.createElement('div')
    dot.className = 'size-5 rounded-full border-[3px] border-white bg-[#2674ff] shadow-[0_0_0_5px_#2674ff22,0_2px_5px_#173f7840]'
    dot.setAttribute('role', 'img')
    dot.setAttribute('aria-label', '나의 현재 위치')
    const marker = new maps.CustomOverlay({ map, position: center, content: dot, xAnchor: .5, yAnchor: .5, zIndex: 10 })
    return () => { accuracy.setMap(null); marker.setMap(null) }
  }, [instance, position])

  useEffect(() => {
    if (!instance) return
    const { maps, map } = instance
    const selectionChanged = focusedSelection.current?.map !== map || focusedSelection.current?.id !== selected?.id
    focusedSelection.current = { map, id: selected?.id }
    // GPS 갱신 중에도 사용자가 지도를 이동할 수 있도록, 선택하거나 위치 버튼을 누를 때만 맞춥니다.
    if (!selectionChanged && !(centerNextFix.current && position)) return
    if (selected && position) {
      const bounds = new maps.LatLngBounds()
      bounds.extend(new maps.LatLng(...selected.position))
      bounds.extend(new maps.LatLng(position.latitude, position.longitude))
      map.setBounds(bounds, 140, 45, Math.max(230, (containerRef.current?.clientHeight ?? 640) * .36), 45)
      if (map.getLevel() < 3) map.setLevel(3)
    } else if (selected) {
      map.setCenter(new maps.LatLng(...selected.position))
    } else if (position && centerNextFix.current) {
      map.setLevel(Math.min(map.getLevel(), 4))
      map.setCenter(new maps.LatLng(position.latitude, position.longitude))
    }
    if (position) centerNextFix.current = false
  }, [instance, selected, position, containerRef])

  function zoom(direction: 'in' | 'out') {
    if (instance) instance.map.setLevel(Math.max(1, Math.min(14, instance.map.getLevel() + (direction === 'in' ? -1 : 1))))
  }
  function resetCampus() {
    centerNextFix.current = false
    if (instance) fitPlaces(instance.maps, instance.map, places)
  }
  return { ready: Boolean(instance), error, retry: () => setAttempt(value => value + 1), zoom, resetCampus, centerNextLocation: () => { centerNextFix.current = true } }
}
