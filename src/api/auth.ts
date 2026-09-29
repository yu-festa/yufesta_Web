import { API_BASE_URL, ApiError, apiRequest } from './client.ts'
import { resultRevealStore } from '../utils/resultReveal.ts'

export type LoginProvider = 'google' | 'kakao'
export type UserRole = 'USER' | 'STAFF' | 'OWNER'
export type AuthMe = {
  role: UserRole
  displayName: string | null
  profileImageUrl: string | null
}
export const LOGIN_SUCCESS_PATH = '/main'

export function getMe() {
  return apiRequest<AuthMe>('/api/v1/auth/me').catch(reason => {
    if (reason instanceof ApiError && reason.status === 401) resultRevealStore.clear()
    throw reason
  })
}

export function logout() {
  return apiRequest<void>('/api/v1/auth/logout', { method: 'POST' }).then(() => { resultRevealStore.clear() })
}

export function oauthLoginUrl(provider: LoginProvider) {
  const query = new URLSearchParams({ redirect: LOGIN_SUCCESS_PATH })
  return `${API_BASE_URL}/oauth2/authorization/${provider}?${query}`
}
