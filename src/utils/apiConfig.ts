export type ApiEnvironment = { DEV?: boolean; VITE_API_BASE_URL?: string; VITE_DEV_API_PROXY?: string }

export function apiOrigin(env?: ApiEnvironment) {
  return (env?.VITE_API_BASE_URL?.trim() || 'https://api.yufesta.com').replace(/\/$/, '')
}

export function apiRequestBase(env?: ApiEnvironment) {
  // OAuth는 원래 서버로 이동하고, 개발 중 API 요청만 Vite의 동일 출처 프록시를 사용합니다.
  return env?.DEV && env.VITE_DEV_API_PROXY !== 'false' ? '' : apiOrigin(env)
}
