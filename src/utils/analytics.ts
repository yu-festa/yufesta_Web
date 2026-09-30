import posthog from 'posthog-js'

/**
 * PostHog 방문 분석. 축제 당일 방문자 수·유입 경로·신청 전환율을 보기 위한 것이다.
 *
 * VITE_POSTHOG_KEY가 없으면 아무것도 보내지 않는다(로컬 개발·팀원 환경).
 * 개인정보는 보내지 않는다: identify를 부르지 않고, 인스타 ID·닉네임·회원 id를 이벤트에 넣지 않는다.
 * 페이지 이동이 #hash라 PostHog의 자동 페이지뷰를 끄고 App에서 page가 바뀔 때 직접 기록한다.
 */
const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'
let enabled = false

export function initAnalytics() {
  if (!key || enabled) return
  posthog.init(key, {
    api_host: host,
    defaults: '2026-05-30',
    capture_pageview: false,
    person_profiles: 'identified_only',
    disable_session_recording: true,
    autocapture: true,
    ip: false,
  })
  enabled = true
}

export function trackPage(page: string) {
  if (enabled) posthog.capture('$pageview', { page })
}

export function track(event: string, properties?: Record<string, string | number | boolean>) {
  if (enabled) posthog.capture(event, properties)
}
