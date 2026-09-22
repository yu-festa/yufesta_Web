import { API_BASE_URL, apiRequest } from './client.ts'

export type LoginProvider = 'google' | 'kakao'
export type UserRole = 'USER' | 'STAFF' | 'OWNER'
export type AuthMe = { role: UserRole }

export function getMe() {
  return apiRequest<AuthMe>('/api/v1/auth/me')
}

export function logout() {
  return apiRequest<void>('/api/v1/auth/logout', { method: 'POST' })
}

export function oauthLoginUrl(provider: LoginProvider, redirect = '/main#profile') {
  const query = new URLSearchParams({ redirect })
  return `${API_BASE_URL}/oauth2/authorization/${provider}?${query}`
}
