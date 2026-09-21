export interface KakaoLatLng { getLat(): number; getLng(): number }
export interface KakaoBounds { extend(position: KakaoLatLng): void }
export interface KakaoMap {
  getCenter(): KakaoLatLng
  setCenter(position: KakaoLatLng): void
  getLevel(): number
  setLevel(level: number): void
  setBounds(bounds: KakaoBounds, top: number, right: number, bottom: number, left: number): void
  relayout(): void
}
export interface KakaoOverlay { setMap(map: KakaoMap | null): void }
export interface KakaoMaps {
  load(callback: () => void): void
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng
  LatLngBounds: new () => KakaoBounds
  CustomOverlay: new (options: { map: KakaoMap; position: KakaoLatLng; content: HTMLElement; xAnchor?: number; yAnchor?: number; zIndex?: number; clickable?: boolean }) => KakaoOverlay
  Circle: new (options: { map: KakaoMap; center: KakaoLatLng; radius: number; strokeWeight: number; strokeColor: string; strokeOpacity: number; fillColor: string; fillOpacity: number }) => KakaoOverlay
  event: {
    addListener(target: KakaoMap, type: string, callback: () => void): void
    removeListener(target: KakaoMap, type: string, callback: () => void): void
  }
}

declare global { interface Window { kakao?: { maps: KakaoMaps } } }

let loading: Promise<KakaoMaps> | undefined

/** Load once across route changes and React StrictMode; failed loads can be retried. */
export function loadKakaoMaps(): Promise<KakaoMaps> {
  if (window.kakao?.maps.Map) return Promise.resolve(window.kakao.maps)
  if (loading) return loading
  const key = import.meta.env.VITE_KAKAO_MAP_KEY?.trim()
  if (!key) return Promise.reject(new Error('카카오맵 JavaScript 키가 설정되지 않았습니다.'))

  loading = new Promise<KakaoMaps>((resolve, reject) => {
    const script = document.createElement('script')
    let settled = false
    const fail = () => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      script.remove()
      reject(new Error('카카오맵 SDK를 불러오지 못했습니다. 키, 등록 도메인과 카카오맵 사용 설정을 확인하세요.'))
    }
    const timeout = window.setTimeout(fail, 15000)
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`
    script.onerror = fail
    script.onload = () => {
      if (settled) return
      if (!window.kakao?.maps) { fail(); return }
      window.kakao.maps.load(() => {
        if (settled) return
        if (!window.kakao?.maps.Map) { fail(); return }
        settled = true
        clearTimeout(timeout)
        resolve(window.kakao.maps)
      })
    }
    document.head.append(script)
  }).catch(error => { loading = undefined; throw error })
  return loading
}
