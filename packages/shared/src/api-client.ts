// packages/shared/src/api-client.ts
//
// Factory for the fetch/refresh/session-expiry machinery that was
// byte-for-byte duplicated across all three apps' utils/api.ts files
// (differing only in localStorage key prefix and the redirect target on
// session expiry). Each app still owns its ~1000 lines of domain-specific
// endpoint functions — this only consolidates the infrastructure beneath them.

export class ApiError extends Error {
  readonly code?: number

  constructor(message: string, code?: number) {
    super(message)
    this.code = code
    this.name = 'ApiError'
  }
}

export interface ApiClientConfig {
  baseUrl: string
  /** '' for the user app, 'admin_' / 'superadmin_' for the staff apps. */
  storagePrefix: string
  /** Where to send the user when the session cannot be refreshed. */
  sessionExpiredRedirect: string
  /** Extra localStorage keys to clear on session expiry, beyond access/refresh/user. */
  extraSessionKeys?: string[]
}

export interface ApiClient {
  request<T>(path: string, options: RequestInit): Promise<T>
  authRequest<T>(path: string, options: RequestInit): Promise<T>
  getAccessToken(): string | null
  getBaseUrl(): string
  clearSessionAndRedirect(): void
}

export function parseJsonSafely(res: Response): Promise<unknown> {
  return res.json().catch((e: unknown) => {
    if (import.meta.env.DEV) console.error('[api] Failed to parse response JSON:', e)
    return {}
  })
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseUrl, storagePrefix, sessionExpiredRedirect, extraSessionKeys = [] } = config
  const accessTokenKey = `${storagePrefix}access_token`
  const refreshTokenKey = `${storagePrefix}refresh_token`
  const userKey = `${storagePrefix}user`

  async function request<T>(path: string, options: RequestInit): Promise<T> {
    const { headers, ...rest } = options
    // FormData bodies (e.g. KYC document uploads) must not get a JSON
    // Content-Type — the browser needs to set its own multipart boundary.
    const isFormData = options.body instanceof FormData
    const contentTypeHeader: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' }

    const res = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers: { ...contentTypeHeader, ...(headers as Record<string, string> | undefined) },
    })

    const data = await parseJsonSafely(res)

    if (res.status === 503 && (data as { maintenance?: boolean }).maintenance) {
      window.location.replace('/maintenance')
      throw new ApiError('Maintenance', 503)
    }

    if (!res.ok) {
      const msg = (data as { message?: string | string[] }).message
      throw new ApiError(Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong'), res.status)
    }

    return data as T
  }

  let isRefreshing = false
  let refreshQueue: Array<(token: string) => void> = []

  async function tryRefresh(): Promise<string> {
    const refreshToken = localStorage.getItem(refreshTokenKey)
    if (!refreshToken) throw new Error('No refresh token')

    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) throw new Error('Refresh failed')

    const data = (await res.json()) as { accessToken: string; refreshToken: string }
    localStorage.setItem(accessTokenKey, data.accessToken)
    localStorage.setItem(refreshTokenKey, data.refreshToken)
    return data.accessToken
  }

  function clearSessionAndRedirect(): void {
    ;[accessTokenKey, refreshTokenKey, userKey, ...extraSessionKeys].forEach((k) =>
      localStorage.removeItem(k),
    )
    window.location.href = sessionExpiredRedirect
  }

  function authHeaders(token?: string): Record<string, string> {
    const t = token ?? localStorage.getItem(accessTokenKey)
    return t ? { Authorization: `Bearer ${t}` } : {}
  }

  async function authRequest<T>(path: string, options: RequestInit): Promise<T> {
    const { headers, ...rest } = options
    const isFormData = options.body instanceof FormData
    const contentTypeHeader: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' }

    const res = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers: {
        ...contentTypeHeader,
        ...authHeaders(),
        ...(headers as Record<string, string> | undefined),
      },
    })

    if (res.status !== 401) {
      const data = await parseJsonSafely(res)
      if (!res.ok) {
        const msg = (data as { message?: string | string[] }).message
        throw new ApiError(Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong'), res.status)
      }
      return data as T
    }

    // 401 — attempt token refresh (queue concurrent calls so we only refresh once)
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const newToken = await tryRefresh()
        refreshQueue.forEach((resolve) => resolve(newToken))
        refreshQueue = []
        isRefreshing = false

        return request<T>(path, {
          ...options,
          headers: { ...authHeaders(newToken), ...(headers as Record<string, string> | undefined) },
        })
      } catch {
        refreshQueue = []
        isRefreshing = false
        clearSessionAndRedirect()
        throw new ApiError('Session expired. Please log in again.')
      }
    }

    // Another request is already refreshing — wait for it
    return new Promise<T>((resolve, reject) => {
      refreshQueue.push((newToken) => {
        resolve(
          request<T>(path, {
            ...options,
            headers: { ...authHeaders(newToken), ...(headers as Record<string, string> | undefined) },
          }),
        )
      })
      setTimeout(() => reject(new ApiError('Session expired')), 30_000)
    })
  }

  function getAccessToken(): string | null {
    return localStorage.getItem(accessTokenKey)
  }

  function getBaseUrl(): string {
    return baseUrl
  }

  return { request, authRequest, getAccessToken, getBaseUrl, clearSessionAndRedirect }
}
