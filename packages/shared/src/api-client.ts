// packages/shared/src/api-client.ts
//
// Factory for the fetch/refresh/session-expiry machinery that was
// byte-for-byte duplicated across the frontend apps' utils/api.ts files
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

  async function performAuthenticatedRequest<T>(
    path: string,
    options: RequestInit,
    token?: string,
  ): Promise<{ response: Response; data: unknown }> {
    const { headers, ...rest } = options
    const isFormData = options.body instanceof FormData
    const contentTypeHeader: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' }

    const response = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers: {
        ...contentTypeHeader,
        ...authHeaders(token),
        ...(headers as Record<string, string> | undefined),
      },
    })

    const data = response.status === 204 ? {} : await parseJsonSafely(response)
    return { response, data }
  }

  function getStoredEmail(): string {
    try {
      const raw = localStorage.getItem(userKey)
      if (!raw) return ''
      const user = JSON.parse(raw) as { email?: string }
      return user.email ?? ''
    } catch {
      return ''
    }
  }

  function showBankRemovalVerificationModal(message?: string): Promise<string | null> {
    return new Promise((resolve) => {
      const existing = document.getElementById('ajoti-bank-removal-verification')
      existing?.remove()

      const overlay = document.createElement('div')
      overlay.id = 'ajoti-bank-removal-verification'
      overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:10000',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'padding:20px',
        'background:rgba(0,0,0,0.55)',
        'font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      ].join(';')

      const card = document.createElement('div')
      card.style.cssText = [
        'width:min(414px,100%)',
        'background:#ffffff',
        'border-radius:10px',
        'box-shadow:0 20px 45px rgba(15,23,42,0.20)',
        'padding:20px 18px 18px',
        'color:#111827',
      ].join(';')

      const header = document.createElement('div')
      header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px'

      const title = document.createElement('h2')
      title.textContent = 'Verify Bank Account Removal'
      title.style.cssText = 'margin:0;font-size:18px;line-height:1.3;font-weight:700;color:#111827'

      const close = document.createElement('button')
      close.type = 'button'
      close.setAttribute('aria-label', 'Close')
      close.textContent = '×'
      close.style.cssText = 'border:0;background:transparent;color:#4B5563;font-size:28px;line-height:1;cursor:pointer;padding:0 2px'

      header.append(title, close)

      const copy = document.createElement('p')
      const email = getStoredEmail()
      copy.style.cssText = 'margin:0 0 28px;color:#374151;font-size:16px;line-height:1.55'
      if (email) {
        copy.append('We’ve sent a 6-digit verification code to ')
        const strong = document.createElement('strong')
        strong.textContent = email
        strong.style.color = '#111827'
        copy.append(strong, '. Enter it below to confirm removal of this bank account.')
      } else {
        copy.textContent = message ?? 'We’ve sent a 6-digit verification code to your email. Enter it below to confirm removal of this bank account.'
      }

      const inputsWrap = document.createElement('div')
      inputsWrap.style.cssText = 'display:flex;justify-content:center;gap:12px;margin:0 0 34px'
      const inputs: HTMLInputElement[] = []

      for (let i = 0; i < 6; i += 1) {
        const input = document.createElement('input')
        input.type = 'text'
        input.inputMode = 'numeric'
        input.autocomplete = i === 0 ? 'one-time-code' : 'off'
        input.maxLength = 1
        input.setAttribute('aria-label', `Verification digit ${i + 1}`)
        input.style.cssText = [
          'width:40px',
          'height:40px',
          'box-sizing:border-box',
          'border:1px solid #D1D5DB',
          'border-radius:9px',
          'background:#ffffff',
          'color:#111827',
          'font-size:20px',
          'font-weight:600',
          'text-align:center',
          'outline:none',
        ].join(';')

        input.addEventListener('focus', () => {
          input.style.borderColor = '#0B7A63'
          input.style.boxShadow = '0 0 0 1px #0B7A63'
        })
        input.addEventListener('blur', () => {
          input.style.borderColor = '#D1D5DB'
          input.style.boxShadow = 'none'
        })
        input.addEventListener('input', () => {
          input.value = input.value.replace(/\D/g, '').slice(0, 1)
          if (input.value && inputs[i + 1]) inputs[i + 1].focus()
        })
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Backspace' && !input.value && inputs[i - 1]) inputs[i - 1].focus()
        })
        input.addEventListener('paste', (event) => {
          const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? ''
          if (!pasted) return
          event.preventDefault()
          pasted.split('').forEach((digit, index) => {
            if (inputs[index]) inputs[index].value = digit
          })
          inputs[Math.min(pasted.length, 6) - 1]?.focus()
        })

        inputs.push(input)
        inputsWrap.appendChild(input)
      }

      const error = document.createElement('p')
      error.style.cssText = 'display:none;margin:-20px 0 18px;color:#DC2626;font-size:13px;text-align:center'

      const verify = document.createElement('button')
      verify.type = 'button'
      verify.textContent = 'Verify & Remove Bank Account'
      verify.style.cssText = [
        'display:block',
        'width:100%',
        'border:0',
        'border-radius:8px',
        'background:#02A36E',
        'color:#ffffff',
        'padding:11px 16px',
        'font-size:14px',
        'font-weight:700',
        'cursor:pointer',
      ].join(';')

      const back = document.createElement('button')
      back.type = 'button'
      back.textContent = 'Back'
      back.style.cssText = 'display:block;margin:14px auto 0;border:0;background:transparent;color:#7C8593;font-size:14px;font-weight:600;cursor:pointer;padding:4px 12px'

      const cleanup = (value: string | null) => {
        document.removeEventListener('keydown', onEscape)
        overlay.remove()
        resolve(value)
      }

      const onEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') cleanup(null)
      }

      const submit = () => {
        const otp = inputs.map((input) => input.value).join('')
        if (!/^\d{6}$/.test(otp)) {
          error.textContent = 'Please enter the 6-digit verification code sent to your email.'
          error.style.display = 'block'
          const firstEmpty = inputs.find((input) => !input.value)
          ;(firstEmpty ?? inputs[0]).focus()
          return
        }
        cleanup(otp)
      }

      verify.addEventListener('click', submit)
      inputs.forEach((input) => input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') submit()
      }))
      close.addEventListener('click', () => cleanup(null))
      back.addEventListener('click', () => cleanup(null))
      overlay.addEventListener('mousedown', (event) => {
        if (event.target === overlay) cleanup(null)
      })
      document.addEventListener('keydown', onEscape)

      card.append(header, copy, inputsWrap, error, verify, back)
      overlay.appendChild(card)
      document.body.appendChild(overlay)
      setTimeout(() => inputs[0]?.focus(), 0)
    })
  }

  async function verifiedBankAccountRemoval<T>(path: string): Promise<T> {
    const requestPath = `${path}/removal/request`
    const confirmPath = `${path}/removal/confirm`

    const requestResult = await authRequest<{ success: boolean; data?: { message?: string } }>(requestPath, {
      method: 'POST',
    })

    const otp = await showBankRemovalVerificationModal(requestResult.data?.message)

    if (otp === null) {
      throw new ApiError('Bank account removal cancelled.')
    }

    return authRequest<T>(confirmPath, {
      method: 'DELETE',
      body: JSON.stringify({ otp }),
    })
  }

  async function authRequest<T>(path: string, options: RequestInit): Promise<T> {
    // Bank-account deletion is deliberately intercepted here because user and admin
    // share this client but maintain separate profile screens. The old one-step DELETE
    // call now becomes request-email-code -> verify-code -> destructive DELETE in both apps.
    if (
      (options.method ?? 'GET').toUpperCase() === 'DELETE' &&
      /^\/api\/users\/me\/bank-accounts\/[^/]+$/.test(path)
    ) {
      return verifiedBankAccountRemoval<T>(path)
    }

    const { response: res, data } = await performAuthenticatedRequest<T>(path, options)

    if (res.status !== 401) {
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

        const { response: retryRes, data: retryData } = await performAuthenticatedRequest<T>(
          path,
          options,
          newToken,
        )
        if (!retryRes.ok) {
          const msg = (retryData as { message?: string | string[] }).message
          throw new ApiError(Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong'), retryRes.status)
        }
        return retryData as T
      } catch (error) {
        refreshQueue = []
        isRefreshing = false
        if (error instanceof ApiError && error.code !== 401) throw error
        clearSessionAndRedirect()
        throw new ApiError('Session expired. Please log in again.')
      }
    }

    // Another request is already refreshing — wait for it
    return new Promise<T>((resolve, reject) => {
      refreshQueue.push((newToken) => {
        performAuthenticatedRequest<T>(path, options, newToken)
          .then(({ response, data: queuedData }) => {
            if (!response.ok) {
              const msg = (queuedData as { message?: string | string[] }).message
              reject(new ApiError(Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong'), response.status))
              return
            }
            resolve(queuedData as T)
          })
          .catch(reject)
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
