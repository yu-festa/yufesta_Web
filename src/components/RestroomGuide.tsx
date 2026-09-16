import { useEffect, useRef, useState } from 'react'
import { filterRestroomLocations, floorLabel, getRestroomBuilding, getRestroomFloors, restroomBuildings, restroomCheckedAt, restroomDetailLevel, restroomSources, unverifiedRestroomBuildings } from '../data/restrooms'
import type { RestroomBuilding, RestroomGender } from '../data/restrooms'

const genderLabels = { male: '남자 화장실', female: '여자 화장실', unspecified: '성별 정보 미확인' } as const
const linkStyle = 'inline-flex min-h-9 items-center gap-1 text-xs font-medium text-[#1554ff] underline underline-offset-4'

function BuildingDetails({ building, onShowOnMap }: { building: RestroomBuilding; onShowOnMap: () => void }) {
  const [floor, setFloor] = useState<number | 'all'>('all')
  const [gender, setGender] = useState<RestroomGender | 'all'>('all')
  const floors = getRestroomFloors(building)
  const locations = filterRestroomLocations(building, floor, gender)
  const visibleFloors = floors.filter(value => locations.some(location => location.floor === value))

  return <>
    <div className="rounded-2xl bg-[#f1f5ff] p-4">
      <p className="text-xs font-semibold text-[#1554ff]">{building.code} · {restroomDetailLevel(building)}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#44546d]">{building.summary}</p>
      <button className="mt-3 flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-[#1554ff]" onClick={onShowOnMap}>건물 위치 보기 <span aria-hidden="true">↗</span></button>
    </div>

    {floors.length > 0 && <>
      <div className="mt-5 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">층별 화장실</h3>
        <label className="text-xs text-[#667085]">
          <span className="sr-only">화장실 구분</span>
          <select className="min-h-10 max-w-38 rounded-lg border border-[#e4e9f0] bg-white px-2 text-xs text-[#344054]" value={gender} onChange={event => setGender(event.target.value as RestroomGender | 'all')}>
            <option value="all">모든 화장실</option>
            <option value="male">남자 화장실</option>
            <option value="female">여자 화장실</option>
            <option value="unspecified">성별 미확인</option>
          </select>
        </label>
      </div>
      <div className="restroom-floor-filters mt-2 flex gap-1.5 overflow-x-auto pb-2" role="group" aria-label="화장실 층 선택">
        {(['all', ...floors] as const).map(value => <button key={value} aria-pressed={floor === value} onClick={() => setFloor(value)} className={`min-h-10 shrink-0 cursor-pointer rounded-full px-3 text-xs font-semibold ${floor === value ? 'bg-[#1554ff] text-white' : 'bg-[#f3f5f8] text-[#667085]'}`}>{value === 'all' ? '전체 층' : floorLabel(value)}</button>)}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-[#667085]">공개 자료에 표시된 위치예요. 호실 번호는 확인되지 않았어요.</p>
      <div aria-live="polite" aria-atomic="true" className="mt-4 space-y-5">
        {visibleFloors.map(value => {
          const floorLocations = locations.filter(location => location.floor === value)
          const planUrl = floorLocations.find(location => location.planUrl)?.planUrl
          return <section key={value} aria-label={`${floorLabel(value)} 화장실`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold">{floorLabel(value)} <span className="ml-1 text-xs font-normal text-[#8b95a5]">{floorLocations.length}개 항목</span></h4>
              {planUrl && <a className={linkStyle} href={planUrl} target="_blank" rel="noopener noreferrer" aria-label={`${building.name} ${floorLabel(value)} 공식 도면 보기`}>도면 보기 ↗</a>}
            </div>
            <ul className="divide-y divide-[#edf0f5] overflow-hidden rounded-2xl border border-[#e8edf4]">
              {floorLocations.map(location => <li key={location.id} className="flex gap-3 p-3.5">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f1f5ff] text-lg">{location.accessible ? '♿' : location.gender === 'male' ? '🚹' : location.gender === 'female' ? '🚺' : '🚻'}</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold">{location.accessible ? '장애인 화장실' : genderLabels[location.gender]}</p>
                  {location.accessible && <p className="mt-0.5 text-[11px] text-[#667085]">{genderLabels[location.gender]}</p>}
                  <p className="mt-1 text-xs leading-relaxed text-[#596579]">{location.directions ?? '층 내부 위치·가까운 호실은 미확인'}</p>
                  <span className="mt-1.5 inline-block text-[10px] text-[#8b95a5]">{location.planUrl ? '공식 도면 기준' : '공식 층별 시설 목록 기준'}</span>
                </div>
              </li>)}
            </ul>
          </section>
        })}
        {locations.length === 0 && <p className="rounded-xl bg-[#f6f8fb] p-4 text-sm leading-relaxed text-[#667085]">선택한 조건으로 확인된 위치가 없어요. 다른 층이나 구분을 선택해 주세요.</p>}
      </div>
    </>}

    <section className="mt-5 rounded-2xl bg-[#f7f8fa] p-4" aria-label="확인 범위와 출처">
      <h3 className="text-xs font-bold text-[#44546d]">확인 범위</h3>
      <p className="mt-2 text-xs leading-relaxed text-[#667085]">{building.coverage}</p>
      {building.notes?.map(note => <div key={note.text} className="mt-3 border-t border-[#e5e9ef] pt-3">
        <p className="text-xs leading-relaxed text-[#667085]">{note.text}</p>
        <a className={linkStyle} href={restroomSources[note.source].url} target="_blank" rel="noopener noreferrer">{restroomSources[note.source].label} ↗</a>
      </div>)}
      <a className={`${linkStyle} mt-2`} href={restroomSources[building.source].url} target="_blank" rel="noopener noreferrer">{restroomSources[building.source].label} ↗</a>
      <p className="mt-1 text-[10px] leading-relaxed text-[#8b95a5]">자료 확인 {restroomCheckedAt} · 현장 확인 전<br />축제 당일·야간 개방 여부는 확인되지 않았어요.</p>
    </section>
  </>
}

function BuildingDirectory({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const search = query.replace(/\s/g, '').toLocaleLowerCase()
  const matches = (building: { name: string; code: string }) => `${building.name}${building.code}`.toLocaleLowerCase().includes(search)
  const buildings = restroomBuildings.filter(matches)
  const unverified = unverifiedRestroomBuildings.filter(matches)

  return <>
    <p className="text-sm leading-relaxed text-[#667085]">건물을 선택하면 확인된 층과 실내 위치를 볼 수 있어요.</p>
    <p className="mt-2 text-xs leading-relaxed text-[#8b95a5]">공개 자료에서 확인한 목록으로, 주변의 모든 화장실을 포함하지는 않아요. 축제 당일 개방 여부는 미확인이에요.</p>
    <label className="mt-4 block">
      <span className="sr-only">화장실 건물 검색</span>
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="건물명 또는 건물 코드 검색" className="min-h-11 w-full rounded-xl border border-[#e4e9f0] bg-[#f8f9fb] px-3 text-sm outline-offset-2 placeholder:text-[#98a2b3]" />
    </label>
    <h3 className="mt-5 text-xs font-bold text-[#667085]">화장실 안내가 있는 건물 <span className="ml-1 text-[#1554ff]">{buildings.length}</span></h3>
    <ul className="mt-2 divide-y divide-[#edf0f5]">
      {buildings.map(building => <li key={building.id}>
        <button className="flex min-h-20 w-full cursor-pointer items-center gap-3 py-3 text-left" onClick={() => onSelect(building.id)}>
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf3ff] text-xl">🚻</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">{building.name} <span className="text-[11px] font-normal text-[#8b95a5]">{building.code}</span></span>
            <span className={`mt-1 block text-xs ${building.locations.length ? 'text-[#1554ff]' : 'text-[#8b95a5]'}`}>{restroomDetailLevel(building)}{building.locations.length > 0 && ` · ${getRestroomFloors(building).map(floorLabel).join(', ')}`}</span>
          </span>
          <span aria-hidden="true" className="text-lg text-[#98a2b3]">›</span>
        </button>
      </li>)}
    </ul>
    {unverified.length > 0 && <section className="mt-4 rounded-2xl bg-[#f6f7f9] p-4" aria-label="상세 위치 미확인 건물">
      <h3 className="text-sm font-bold text-[#596579]">상세 위치 미확인</h3>
      <ul className="mt-2 space-y-1 text-xs text-[#667085]">{unverified.map(building => <li key={building.code}>{building.name} <span className="text-[#98a2b3]">{building.code}</span></li>)}</ul>
      <p className="mt-3 text-xs leading-relaxed text-[#8b95a5]">층·호실 앞 위치를 확인할 자료가 없어 상세 안내를 제공하지 않아요. 화장실이 없다는 뜻은 아니에요.</p>
    </section>}
    {buildings.length === 0 && unverified.length === 0 && <p role="status" className="py-8 text-center text-sm text-[#8b95a5]">검색된 건물이 없어요.</p>}
  </>
}

export default function RestroomGuide({ initialBuildingId, onClose, onShowOnMap }: {
  initialBuildingId: string | null
  onClose: () => void
  onShowOnMap: (id: string) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [buildingId, setBuildingId] = useState(initialBuildingId)
  const building = getRestroomBuilding(buildingId)

  useEffect(() => {
    const dialog = dialogRef.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])

  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
    headingRef.current?.focus()
  }, [buildingId])

  return <dialog ref={dialogRef} aria-labelledby="restroom-guide-title" className="fixed inset-0 m-auto max-h-[88dvh] w-[calc(100%-24px)] max-w-110 overflow-hidden rounded-3xl border-0 bg-white p-0 text-[#222] shadow-2xl backdrop:bg-[#16254066]"
    onClose={event => { if (!event.currentTarget.open) onClose() }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialogRef.current?.close()
    }}>
    <div className="flex max-h-[88dvh] flex-col">
      <header className="flex shrink-0 items-center gap-1 border-b border-[#edf0f5] px-4 py-3">
        {building && <button className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-2xl text-[#667085]" onClick={() => setBuildingId(null)} aria-label="화장실 건물 목록으로">‹</button>}
        <div className="min-w-0 flex-1 px-1">
          <p className="text-[10px] font-semibold tracking-wider text-[#1554ff]">RESTROOM GUIDE</p>
          <h2 id="restroom-guide-title" ref={headingRef} tabIndex={-1} className="mt-1 text-base font-bold focus:outline-none">{building ? `${building.name} 화장실` : '화장실 상세 안내'}</h2>
        </div>
        <button className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-[#667085]" onClick={() => dialogRef.current?.close()} aria-label="화장실 안내 닫기"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m6 6 12 12M6 18 18 6" /></svg></button>
      </header>
      <div ref={contentRef} className="restroom-guide-body min-h-0 overflow-y-auto overscroll-contain p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        {building ? <BuildingDetails key={building.id} building={building} onShowOnMap={() => { onShowOnMap(building.id); dialogRef.current?.close() }} /> : <BuildingDirectory onSelect={setBuildingId} />}
      </div>
    </div>
  </dialog>
}
