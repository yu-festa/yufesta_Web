import { useMemo, useRef, useState } from 'react'
import { festivalPlaces, getFilteredPlaces, mapCategories, mapSources } from '../data/festivalMap'
import type { MapFilter } from '../data/festivalMap'
import { useCurrentLocation } from '../hooks/useCurrentLocation'
import { useKakaoFestivalMap } from '../hooks/useKakaoFestivalMap'
import RestroomGuide from '../components/RestroomGuide'
import { distanceInMeters, formatMapDistance, getNearbyRestrooms } from '../utils/mapPlaces'

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

export default function FestivalMap({ onBack }: { onBack: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [filter, setFilter] = useState<MapFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [nearbyStageId, setNearbyStageId] = useState<string | null>(null)
  const [restroomGuide, setRestroomGuide] = useState<{ buildingId: string | null } | null>(null)
  const { location, requestLocation } = useCurrentLocation()
  const nearbyStage = festivalPlaces.find(place => place.id === nearbyStageId && place.category === 'stage')
  const nearbyRestrooms = useMemo(() => nearbyStage ? getNearbyRestrooms(nearbyStage) : [], [nearbyStage])
  const places = useMemo(() => nearbyStage
    ? [nearbyStage, ...nearbyRestrooms.map(({ place }) => place)]
    : getFilteredPlaces(filter), [filter, nearbyStage, nearbyRestrooms])
  const selected = places.find(place => place.id === selectedId)
  const selectedDistance = nearbyRestrooms.find(({ place }) => place.id === selectedId)?.distance
  const currentDistance = selected && location.position ? distanceInMeters([location.position.latitude, location.position.longitude], selected.position) : null
  const { ready, error, retry, zoom, resetCampus, centerNextLocation } = useKakaoFestivalMap(containerRef, places, selected, location.position, setSelectedId)

  function changeFilter(nextFilter: MapFilter) {
    setSelectedId(null)
    setNearbyStageId(null)
    setFilter(nextFilter)
  }

  function showNearbyRestrooms(stageId: string) {
    setNearbyStageId(stageId)
    setSelectedId(null)
    setFilter('restroom')
  }

  function locate() {
    centerNextLocation()
    requestLocation()
  }

  function showRestroomOnMap(id: string) {
    if (!festivalPlaces.some(place => place.id === id)) return
    if (!nearbyRestrooms.some(({ place }) => place.id === id)) setNearbyStageId(null)
    setFilter('restroom')
    setSelectedId(id)
  }

  return (
    <main className="festival-map relative isolate mx-auto h-dvh min-h-100 w-full max-w-(--app-max-width) overflow-hidden bg-[#e7eee7] text-[#222] [&_button:focus-visible]:outline-3 [&_button:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-[#1554ff] [&_a:focus-visible]:outline-3 [&_a:focus-visible]:outline-offset-3 [&_a:focus-visible]:outline-[#1554ff] [&_input:focus-visible]:outline-3 [&_input:focus-visible]:outline-[#1554ff] [&_select:focus-visible]:outline-3 [&_select:focus-visible]:outline-[#1554ff]">
      <h1 className="sr-only">영남대학교 축제 지도</h1>
      <div ref={containerRef} className="absolute inset-0 z-0" role="region" aria-label="영남대학교 카카오맵" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-linear-to-b from-white/55 to-transparent px-4 pt-[max(12px,env(safe-area-inset-top))] pb-5">
        <div className="flex items-center justify-between gap-3">
          <button className={`${roundButton} pointer-events-auto`} onClick={onBack} aria-label="메인으로 돌아가기"><ControlIcon name="back" /></button>
          <button className={`${roundButton} pointer-events-auto`} onClick={() => dialogRef.current?.showModal()} aria-label="지도 정보와 출처"><ControlIcon name="info" /></button>
        </div>
        <nav className="pointer-events-auto mt-3 flex gap-2" aria-label="지도 장소 필터">
          {mapCategories.map(category => (
            <button key={category.id} aria-pressed={filter === category.id} onClick={() => changeFilter(category.id)}
              className={`flex min-h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 rounded-full px-2 text-[14px] font-semibold whitespace-nowrap shadow-[0_2px_8px_#2437521a] ${filter === category.id ? 'bg-[#1554ff] text-white' : 'bg-white text-[#333]'}`}>
              {category.icon && <span aria-hidden="true" className="text-sm">{category.icon}</span>}{category.label}
            </button>
          ))}
        </nav>
        {error ? <div role="alert" className="pointer-events-auto mt-3 rounded-xl bg-white/95 p-3 text-xs leading-relaxed shadow-sm">
          카카오맵을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          <button className="ml-2 cursor-pointer font-bold text-[#1554ff] underline" onClick={retry}>다시 불러오기</button>
        </div> : !ready && <p className="mt-3 w-fit rounded-full bg-white/95 px-3 py-1.5 text-xs text-[#596579]" role="status">지도를 불러오고 있어요…</p>}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(30px+env(safe-area-inset-bottom))] z-10 px-4">
        <div className="mb-3 flex items-end justify-between">
          <button className="pointer-events-auto flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold shadow-[0_2px_12px_#24375224]" onClick={() => { setSelectedId(null); resetCampus() }}><ControlIcon name="campus" />축제 장소로</button>
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <div className="overflow-hidden rounded-full bg-white shadow-[0_2px_12px_#24375224]">
              <button className="grid size-11 cursor-pointer place-items-center border-b border-[#edf0f3] text-xl" aria-label="지도 확대" onClick={() => zoom('in')}>+</button>
              <button className="grid size-11 cursor-pointer place-items-center text-xl" aria-label="지도 축소" onClick={() => zoom('out')}>−</button>
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
              {selected.category === 'restroom' ? <>
                {selectedDistance !== undefined && <p className="mt-2 text-xs font-semibold text-[#1554ff]">{nearbyStage?.name}에서 직선 {formatMapDistance(selectedDistance)}</p>}
                <button className="mt-3 min-h-11 w-full cursor-pointer rounded-xl bg-[#1554ff] px-3 text-sm font-semibold text-white" onClick={() => setRestroomGuide({ buildingId: selected.id })}>화장실 상세 위치 보기 <span aria-hidden="true">›</span></button>
                <p className="mt-2 text-[10px] text-[#8b95a5]">핀은 건물 위치예요 · 축제 당일 개방 여부 미확인</p>
              </> : <>
                {selected.category === 'stage' && <button className="mt-3 min-h-11 w-full cursor-pointer rounded-xl bg-[#1554ff] px-3 text-sm font-semibold text-white" onClick={() => showNearbyRestrooms(selected.id)}>공연장 근처 화장실 보기 <span aria-hidden="true">›</span></button>}
                <a className="mt-3 inline-block text-[11px] text-[#667085] underline underline-offset-2" href={mapSources[selected.source].url} target="_blank" rel="noopener noreferrer">{mapSources[selected.source].label} ↗</a>
              </>}
              <div className="mt-3 border-t border-[#edf0f3] pt-3">
                {currentDistance !== null && <div className="mb-3 rounded-xl bg-[#f0f5ff] p-3">
                  <p className="text-[11px] text-[#667085]">현재 위치에서 {selected.name}까지</p>
                  <p className="mt-1 text-base font-bold text-[#1554ff]">직선 {formatMapDistance(currentDistance)}</p>
                  <p className="mt-1 text-[10px] text-[#8b95a5]">실제 걸어가는 거리와는 달라요.</p>
                </div>}
                <button className="min-h-11 w-full cursor-pointer rounded-xl bg-[#f0f5ff] px-3 text-xs font-semibold text-[#1554ff] disabled:cursor-wait disabled:opacity-60" onClick={locate} disabled={location.status === 'loading' || !ready}>
                  {location.status === 'loading' ? '현재 위치 확인 중…' : currentDistance !== null ? '현재 위치 다시 확인' : '현재 위치와 거리 확인'}
                </button>
                {location.status === 'idle' && <p className="mt-2 text-[10px] leading-relaxed text-[#8b95a5]">위치를 허용하면 내 위치와 선택한 장소를 함께 보여드려요.</p>}
              </div>
            </> : nearbyStage ? <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold">공연장 근처 화장실 <span className="ml-1 text-[#1554ff]">{nearbyRestrooms.length}</span></h2>
                <button className="min-h-9 shrink-0 cursor-pointer text-xs font-semibold text-[#1554ff]" onClick={() => changeFilter('restroom')}>전체 보기</button>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[#667085]">{nearbyStage.name} 기준 · 반경 500m<br />건물까지 직선 거리순 · 당일 개방 여부 미확인</p>
              {nearbyRestrooms.length ? <ul className="mt-2 divide-y divide-[#edf0f3]">
                {nearbyRestrooms.map(({ place, distance }) => <li key={place.id}>
                  <button className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 py-2 text-left" onClick={() => setSelectedId(place.id)}>
                    <span className="min-w-0"><span className="block text-xs font-semibold">{place.name}</span><span className="mt-0.5 block text-[10px] text-[#8b95a5]">{place.status}</span></span>
                    <span className="shrink-0 text-xs font-semibold text-[#1554ff]">{formatMapDistance(distance)} <span aria-hidden="true">›</span></span>
                  </button>
                </li>)}
              </ul> : <p className="mt-3 text-xs text-[#667085]">반경 500m 안에서 확인된 화장실 건물이 없어요.</p>}
            </> : filter === 'delivery' ? <>
              <h2 className="text-sm font-bold">배달존 위치를 확인 중이에요</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#667085]">작년 배달존의 공식 위치 자료가 확인되지 않았어요. 위치가 확인되면 지도에 표시할 예정이에요.</p>
            </> : <>
              <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-bold">{filter === 'all' ? '축제 주변 장소' : filter === 'restroom' ? '화장실 안내 건물' : '공연장'} <span className="ml-1 text-[#1554ff]">{places.length}</span></h2><span className="text-[11px] text-[#8b95a5]">핀을 눌러 확인하세요</span></div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#667085]">{filter === 'restroom' ? '층별 위치와 남녀 구분을 확인해 보세요. 공개 자료에서 확인한 일부 시설이며, 당일 개방 여부는 미확인이에요.' : <>2025년 5월 공연장 · 교내 상설 화장실<br />올해 배치와 다를 수 있어요. 배달존은 위치 확인 중이에요.</>}</p>
              {(filter === 'all' || filter === 'restroom') && <button className="mt-3 flex min-h-10 w-full cursor-pointer items-center justify-between rounded-xl bg-[#f0f5ff] px-3 text-xs font-semibold text-[#1554ff]" onClick={() => setRestroomGuide({ buildingId: null })}>화장실 건물·층별 목록 <span aria-hidden="true">›</span></button>}
            </>}
          </section>
        </div>
      </div>

      <dialog ref={dialogRef} className="fixed inset-0 m-auto max-h-[80dvh] w-[min(420px,calc(100%-40px))] overflow-y-auto rounded-2xl border-0 bg-white p-5 text-[#222] shadow-xl backdrop:bg-[#11182766]" aria-labelledby="map-info-title" onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close() }}>
        <div className="flex items-center justify-between gap-3"><h2 id="map-info-title" className="text-lg font-bold">지도 정보</h2><button className="grid size-10 cursor-pointer place-items-center" onClick={() => dialogRef.current?.close()} aria-label="지도 정보 닫기"><ControlIcon name="close" /></button></div>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#667085]">
          <p>공연장은 <strong className="font-semibold text-[#344054]">2025년 5월 26~28일 천마대동제</strong> 자료를 참고했어요. 2025년 가을축제 배치도는 확인되지 않아 반영하지 않았어요.</p>
          <p>화장실은 교내 상설 시설이에요. 핀은 건물 대표 위치예요. 상세 안내에서 도면으로 확인한 실내 위치와 층만 확인된 시설을 구분해 보여드려요. 공개 자료에 없는 층·호실은 추정하지 않았으며, 모든 화장실을 포함하지는 않아요. 축제 당일·야간 개방 여부는 미확인이에요.</p>
          <p>배달존은 작년 공식 위치를 확인하지 못해 표시하지 않았어요. 올해 축제의 배치·운영 여부는 추후 공지를 확인해 주세요.</p>
          <p>현재 위치 버튼을 누르면 위치 권한을 요청해요. 파란 원은 위치 오차 범위예요. 선택한 장소까지 직선 거리를 기기에서 계산해 표시하며, 실제 보행 거리와는 달라요. 사이트는 위치를 저장하거나 별도 경로 서버로 전송하지 않아요.</p>
          <ul className="space-y-2 border-t border-[#edf0f3] pt-3 text-xs">{Object.values(mapSources).map(source => <li key={source.url}><a className="text-[#1554ff] underline underline-offset-2" href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></li>)}</ul>
        </div>
      </dialog>
      {restroomGuide && <RestroomGuide initialBuildingId={restroomGuide.buildingId} onClose={() => setRestroomGuide(null)} onShowOnMap={showRestroomOnMap} />}
    </main>
  )
}
