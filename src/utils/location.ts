export interface UserPosition {
  latitude: number
  longitude: number
  accuracy: number
}

export type LocationState =
  | { status: 'idle' | 'loading'; position: null; message: string }
  | { status: 'ready'; position: UserPosition; message: string }
  | { status: 'error'; position: null; message: string }

const errorMessages: Record<number, string> = {
  1: '위치 권한이 꺼져 있어요. 브라우저 설정에서 위치 접근을 허용한 뒤 다시 눌러 주세요.',
  2: '현재 위치를 확인할 수 없어요. 기기의 위치 기능을 켜고 다시 눌러 주세요.',
  3: '위치를 찾는 데 시간이 걸리고 있어요. 잠시 후 다시 눌러 주세요.',
}

// 브라우저 API를 주입받아 권한 오류와 화면 이탈 시 watch 해제를 검증합니다.
export function watchCurrentLocation(
  geolocation: Pick<Geolocation, 'watchPosition' | 'clearWatch'> | undefined,
  secureContext: boolean,
  onChange: (state: LocationState) => void,
): () => void {
  if (!secureContext || !geolocation) {
    onChange({ status: 'error', position: null, message: !secureContext
      ? '현재 위치는 HTTPS 연결에서 사용할 수 있어요.'
      : '이 브라우저에서는 현재 위치를 지원하지 않아요.' })
    return () => {}
  }

  let active = true
  let watchId: number | undefined
  const stop = () => {
    active = false
    if (watchId !== undefined) geolocation.clearWatch(watchId)
    watchId = undefined
  }
  onChange({ status: 'loading', position: null, message: '현재 위치를 찾고 있어요…' })

  try {
    watchId = geolocation.watchPosition(({ coords }) => {
      if (!active) return
      const { latitude, longitude, accuracy } = coords
      if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude)
        || Math.abs(longitude) > 180 || !Number.isFinite(accuracy) || accuracy < 0) {
        stop()
        onChange({ status: 'error', position: null, message: errorMessages[2] })
        return
      }
      onChange({ status: 'ready', position: { latitude, longitude, accuracy }, message: '현재 위치를 표시했어요.' })
    }, error => {
      if (!active) return
      stop()
      onChange({ status: 'error', position: null, message: errorMessages[error.code] ?? errorMessages[2] })
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 })
    // 동기적으로 콜백을 실행하는 구현에서도 실패한 watch를 남기지 않습니다.
    if (!active) stop()
  } catch {
    stop()
    onChange({ status: 'error', position: null, message: errorMessages[2] })
  }
  return stop
}
