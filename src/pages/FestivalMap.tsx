import { useEffect, useMemo, useRef, useState } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './FestivalMap.css'
import { campusCenter, festivalPlaces, getFilteredPlaces, mapCategories, mapSources } from '../data/festivalMap'
import type { FestivalPlace, MapFilter } from '../data/festivalMap'
import { useCurrentLocation } from '../hooks/useCurrentLocation'

const roundButton = 'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-[#344054] shadow-[0_2px_12px_#24375224] disabled:cursor-wait disabled:opacity-60'

function ControlIcon({ name }: { name: 'back' | 'location' | 'campus' | 'close' | 'info' }) {
  const paths = {
    back: <path d="m14 5-7 7 7 7" />,
    location: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>,
    campus: <><path d="m3 8 9-5 9 5-9 5-9-5Zm3 2v7l6 4 6-4v-7M21 8v8" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  }
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function fitPlaces(map: L.Map, places: FestivalPlace[]) {
  if (!places.length) return
  map.fitBounds(L.latLngBounds(places.map(place => place.position)), {
    paddingTopLeft: [40, 140], paddingBottomRight: [40, 170], maxZoom: 17, animate: false,
  })
}

export default function FestivalMap({ onBack }: { onBack: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tilesRef = useRef<L.TileLayer | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const locationLayerRef = useRef<L.LayerGroup | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const centerNextFix = useRef(false)
  const [filter, setFilter] = useState<MapFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tileError, setTileError] = useState(false)
  const [tilesLoading, setTilesLoading] = useState(true)
  const { location, requestLocation } = useCurrentLocation()
  const places = useMemo(() => getFilteredPlaces(filter), [filter])
  const selected = places.find(place => place.id === selectedId)

  useEffect(() => {
    if (!containerRef.current) return
    const map = L.map(containerRef.current, {
      center: campusCenter, zoom: 16, minZoom: 3, maxZoom: 19,
      zoomControl: false, attributionControl: true,
    })
    map.attributionControl.setPrefix(false)
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    })
    let loadedTile = false
    tiles.on('loading', () => setTilesLoading(true))
    tiles.on('tileload', () => { loadedTile = true })
    tiles.on('load', () => setTilesLoading(false))
    tiles.on('tileerror', () => setTileError(true))
    tiles.addTo(map)
    const loadingTimeout = window.setTimeout(() => {
      if (!loadedTile) { setTileError(true); setTilesLoading(false) }
    }, 15000)
    mapRef.current = map
    tilesRef.current = tiles
    markersRef.current = L.layerGroup().addTo(map)
    locationLayerRef.current = L.layerGroup().addTo(map)
    fitPlaces(map, festivalPlaces)
    map.on('click', () => setSelectedId(null))
    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    resizeObserver.observe(containerRef.current)
    return () => {
      window.clearTimeout(loadingTimeout)
      resizeObserver.disconnect()
      tiles.off()
      map.remove()
      mapRef.current = null
      tilesRef.current = null
      markersRef.current = null
      locationLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = markersRef.current
    if (!map || !layer) return
    layer.clearLayers()
    for (const place of places) {
      const category = mapCategories.find(item => item.id === place.category)!
      const content = document.createElement('span')
      content.className = 'festival-marker-content'
      content.setAttribute('aria-hidden', 'true')
      content.textContent = category.icon
      const marker = L.marker(place.position, {
        icon: L.divIcon({
          className: `festival-marker festival-marker--${place.category}`,
          html: content, iconSize: [44, 44], iconAnchor: [22, 22],
        }),
        title: place.name, alt: place.name, keyboard: true, riseOnHover: true,
      }).addTo(layer)
      marker.getElement()?.setAttribute('aria-label', `${place.name} · ${place.status}`)
      marker.on('click', () => {
        setSelectedId(place.id)
        map.panInside(place.position, { paddingTopLeft: [40, 150], paddingBottomRight: [40, 260], animate: false })
      })
      const label = document.createElement('span')
      label.textContent = place.name
      marker.bindTooltip(label, { direction: 'top', offset: [0, -22] })
    }
    fitPlaces(map, places)
    return () => { layer.clearLayers() }
  }, [places])

  useEffect(() => {
    const map = mapRef.current
    const layer = locationLayerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    if (!location.position) return
    const { latitude, longitude, accuracy } = location.position
    const position: L.LatLngTuple = [latitude, longitude]
    L.circle(position, {
      radius: accuracy, color: '#2674ff', weight: 1, opacity: 0.3,
      fillColor: '#2674ff', fillOpacity: 0.12, interactive: false,
    }).addTo(layer)
    L.marker(position, {
      icon: L.divIcon({ className: 'festival-user-location', iconSize: [20, 20], iconAnchor: [10, 10] }),
      title: '나의 현재 위치', alt: '나의 현재 위치', zIndexOffset: 1000,
    }).bindTooltip('나의 현재 위치').addTo(layer)
    if (centerNextFix.current) {
      map.setView(position, Math.max(map.getZoom(), 16), { animate: false })
      centerNextFix.current = false
    }
  }, [location.position])

  function changeFilter(nextFilter: MapFilter) {
    setSelectedId(null)
    setFilter(nextFilter)
  }

  function locate() {
    centerNextFix.current = true
    setSelectedId(null)
    requestLocation()
  }

  function resetCampus() {
    centerNextFix.current = false
    setSelectedId(null)
    if (mapRef.current) fitPlaces(mapRef.current, places.length ? places : festivalPlaces)
  }

  return (
    <main className="festival-map relative isolate mx-auto h-dvh min-h-100 w-full max-w-(--app-max-width) overflow-hidden bg-[#e7eee7] text-[#222]">
      <h1 className="sr-only">영남대학교 축제 지도</h1>
      <div ref={containerRef} className="absolute inset-0 z-0" role="region" aria-label="영남대학교 지도. 방향키로 이동하고 더하기와 빼기로 확대 또는 축소할 수 있어요." />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-linear-to-b from-white/55 to-transparent px-4 pt-[max(12px,env(safe-area-inset-top))] pb-5">
        <div className="flex items-center justify-between gap-3">
          <button className={`${roundButton} pointer-events-auto`} onClick={onBack} aria-label="메인으로 돌아가기"><ControlIcon name="back" /></button>
          <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-bold shadow-sm">축제 지도</span>
          <button className={`${roundButton} pointer-events-auto`} onClick={() => dialogRef.current?.showModal()} aria-label="지도 정보와 출처"><ControlIcon name="info" /></button>
        </div>
        <nav className="pointer-events-auto mt-3 flex gap-2" aria-label="지도 장소 필터">
          {mapCategories.map(category => (
            <button key={category.id} aria-pressed={filter === category.id} onClick={() => changeFilter(category.id)}
              className={`flex min-h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 rounded-full px-2 text-[12px] font-semibold whitespace-nowrap shadow-[0_2px_8px_#2437521a] ${filter === category.id ? 'bg-[#1554ff] text-white' : 'bg-white text-[#333]'}`}>
              {category.icon && <span aria-hidden="true" className="text-sm">{category.icon}</span>}{category.label}
            </button>
          ))}
        </nav>
        {tileError ? <div role="alert" className="pointer-events-auto mt-3 rounded-xl bg-white/95 p-3 text-xs leading-relaxed shadow-sm">
          배경 지도를 불러오지 못했어요. 네트워크 연결을 확인해 주세요.
          <button className="ml-2 cursor-pointer font-bold text-[#1554ff] underline" onClick={() => { setTileError(false); tilesRef.current?.redraw() }}>다시 불러오기</button>
        </div> : tilesLoading && <p className="mt-3 w-fit rounded-full bg-white/95 px-3 py-1.5 text-xs text-[#596579]" role="status">지도를 불러오고 있어요…</p>}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(30px+env(safe-area-inset-bottom))] z-10 px-4">
        <div className="mb-3 flex items-end justify-between">
          <button className="pointer-events-auto flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold shadow-[0_2px_12px_#24375224]" onClick={resetCampus}><ControlIcon name="campus" />축제 장소로</button>
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <div className="overflow-hidden rounded-full bg-white shadow-[0_2px_12px_#24375224]">
              <button className="grid size-11 cursor-pointer place-items-center border-b border-[#edf0f3] text-xl" aria-label="지도 확대" onClick={() => mapRef.current?.zoomIn()}>+</button>
              <button className="grid size-11 cursor-pointer place-items-center text-xl" aria-label="지도 축소" onClick={() => mapRef.current?.zoomOut()}>−</button>
            </div>
            <button className={`${roundButton} ${location.status === 'ready' ? '!text-[#1554ff]' : ''}`} onClick={locate} disabled={location.status === 'loading'} aria-label="나의 현재 위치" aria-busy={location.status === 'loading'}><ControlIcon name="location" /></button>
          </div>
        </div>

        <div className="pointer-events-auto space-y-2">
          {location.message && <p role="status" className={`rounded-xl px-3 py-2 text-xs leading-relaxed shadow-sm ${location.status === 'error' ? 'bg-[#fff4e8] text-[#8f4a13]' : 'bg-white/95 text-[#536175]'}`}>
            {location.message}{location.position && <span className="ml-1">오차 약 {Math.round(location.position.accuracy).toLocaleString()}m</span>}
          </p>}
          <section className="relative max-h-[32dvh] overflow-y-auto rounded-2xl bg-white p-4 shadow-[0_4px_24px_#2437521a]" aria-live="polite" aria-atomic="true" aria-label="장소 안내">
            {selected ? <>
              <button className="absolute top-2 right-2 grid size-9 cursor-pointer place-items-center rounded-full text-[#7b8492]" aria-label="장소 설명 닫기" onClick={() => setSelectedId(null)}><ControlIcon name="close" /></button>
              <p className="pr-8 text-[11px] font-semibold text-[#1554ff]">{selected.status}</p>
              <h2 className="mt-1 pr-8 text-base font-bold">{selected.name}</h2>
              <p className="mt-2 text-xs leading-relaxed text-[#667085]">{selected.description}</p>
              <a className="mt-3 inline-block text-[11px] text-[#667085] underline underline-offset-2" href={mapSources[selected.source].url} target="_blank" rel="noopener noreferrer">{mapSources[selected.source].label} ↗</a>
            </> : filter === 'delivery' ? <>
              <h2 className="text-sm font-bold">배달존 위치를 확인 중이에요</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#667085]">작년 배달존의 공식 위치 자료가 확인되지 않았어요. 위치가 확인되면 지도에 표시할 예정이에요.</p>
            </> : <>
              <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-bold">{filter === 'all' ? '축제 주변 장소' : mapCategories.find(category => category.id === filter)?.label} <span className="ml-1 text-[#1554ff]">{places.length}</span></h2><span className="text-[11px] text-[#8b95a5]">핀을 눌러 확인하세요</span></div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#667085]">2025년 5월 공연장 · 교내 상설 화장실<br />올해 배치와 다를 수 있어요. 배달존은 위치 확인 중이에요.</p>
            </>}
          </section>
        </div>
      </div>

      <dialog ref={dialogRef} className="fixed inset-0 m-auto max-h-[80dvh] w-[min(420px,calc(100%-40px))] overflow-y-auto rounded-2xl border-0 bg-white p-5 text-[#222] shadow-xl backdrop:bg-[#11182766]" aria-labelledby="map-info-title" onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close() }}>
        <div className="flex items-center justify-between gap-3"><h2 id="map-info-title" className="text-lg font-bold">지도 정보</h2><button className="grid size-10 cursor-pointer place-items-center" onClick={() => dialogRef.current?.close()} aria-label="지도 정보 닫기"><ControlIcon name="close" /></button></div>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#667085]">
          <p>공연장은 <strong className="font-semibold text-[#344054]">2025년 5월 26~28일 천마대동제</strong> 자료를 참고했어요. 2025년 가을축제 배치도는 확인되지 않아 반영하지 않았어요.</p>
          <p>화장실은 교내 상설 시설이에요. 핀은 건물·시설의 대표 위치이며, 출입구나 임시 화장실 위치는 아니에요. 개방 시간은 현장에서 확인해 주세요.</p>
          <p>배달존은 작년 공식 위치를 확인하지 못해 표시하지 않았어요. 올해 축제의 배치·운영 여부는 추후 공지를 확인해 주세요.</p>
          <p>현재 위치 버튼을 누르면 위치 권한을 요청해요. 위치는 이 화면에서만 사용하며 저장하지 않아요. 파란 원은 위치 오차 범위예요.</p>
          <ul className="space-y-2 border-t border-[#edf0f3] pt-3 text-xs">{Object.values(mapSources).map(source => <li key={source.url}><a className="text-[#1554ff] underline underline-offset-2" href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></li>)}</ul>
        </div>
      </dialog>
    </main>
  )
}
