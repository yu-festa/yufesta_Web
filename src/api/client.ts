export type ValidationError = {
  field: string
  value?: unknown
  reason: string
}

export type ApiResponse<T> = {
  status: number
  message: string
  data: T
}

export type ApiErrorBody = {
  status: number
  code: string
  message: string
  errors: ValidationError[]
}

type ViteEnv = { DEV?: boolean; VITE_API_BASE_URL?: string }
const env = (import.meta as ImportMeta & { env?: ViteEnv }).env
const configuredBaseUrl = env?.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = (configuredBaseUrl || (env?.DEV ? 'http://localhost:8080' : '')).replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly errors: ValidationError[]

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.code = body.code
    this.errors = body.errors ?? []
  }
}

function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return null
  const prefix = `${encodeURIComponent(name)}=`
  const cookie = document.cookie.split('; ').find(value => value.startsWith(prefix))
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

async function parseError(response: Response) {
  const fallback: ApiErrorBody = {
    status: response.status,
    code: 'HTTP_ERROR',
    message: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    errors: [],
  }

  try {
    const body = await response.json() as Partial<ApiErrorBody>
    return new ApiError({
      status: typeof body.status === 'number' ? body.status : fallback.status,
      code: typeof body.code === 'string' ? body.code : fallback.code,
      message: typeof body.message === 'string' ? body.message : fallback.message,
      errors: Array.isArray(body.errors) ? body.errors : [],
    })
  } catch {
    return new ApiError(fallback)
  }
}

async function rawFetch(path: string, init: RequestInit = {}) {
  try {
    return await fetch(apiUrl(path), { ...init, credentials: 'include' })
  } catch {
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.',
      errors: [],
    })
  }
}

let csrfRequest: Promise<void> | null = null

export async function ensureCsrfToken() {
  if (readCookie('XSRF-TOKEN')) return
  if (!csrfRequest) {
    csrfRequest = rawFetch('/api/v1/auth/csrf').then(async response => {
      if (!response.ok) throw await parseError(response)
    }).finally(() => { csrfRequest = null })
  }
  await csrfRequest
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    await ensureCsrfToken()
    const csrfToken = readCookie('XSRF-TOKEN')
    if (csrfToken) headers.set('X-XSRF-TOKEN', csrfToken)
  }
  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await rawFetch(path, { ...init, method, headers })
  if (!response.ok) throw await parseError(response)
  if (response.status === 204) return undefined as T

  const body = await response.json() as ApiResponse<T>
  return body.data
}
