const SPLASH_SEEN_KEY = 'yufesta:splash-seen'

export function shouldShowSplash() {
  try { if (window.localStorage.getItem(SPLASH_SEEN_KEY) === 'true') return false }
  catch { /* 영구 저장소를 사용할 수 없으면 세션 저장소를 확인합니다. */ }
  try { if (window.sessionStorage.getItem(SPLASH_SEEN_KEY) === 'true') return false }
  catch { /* 저장소가 모두 차단된 환경에서는 첫 화면을 정상 표시합니다. */ }
  return true
}

export function markSplashSeen() {
  // 기존 세션 기록도 영구 저장소로 옮겨 새 탭·재방문에서 반복하지 않습니다.
  try { window.localStorage.setItem(SPLASH_SEEN_KEY, 'true') }
  catch { /* 저장소 제한이 사이트 진입을 막지 않도록 합니다. */ }
  try { window.sessionStorage.setItem(SPLASH_SEEN_KEY, 'true') }
  catch { /* 세션 저장소도 차단될 수 있습니다. */ }
}
