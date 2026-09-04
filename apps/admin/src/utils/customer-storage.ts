const LEGACY_TO_CUSTOMER_KEYS = {
  access_token: 'access_token',
  refresh_token: 'refresh_token',
  user: 'user',
  kyc_completed: 'kyc_completed',
  verify_email: 'verify_email',
} as const

const CACHED_USER_FIELDS = ['id', '_id', 'firstName', 'lastName', 'role', 'status', 'phone'] as const

export function storeCachedCustomerUser(value: unknown): void {
  if (!value || typeof value !== 'object') {
    localStorage.removeItem('user')
    return
  }

  const source = value as Record<string, unknown>
  const cached: Record<string, string> = {}
  for (const field of CACHED_USER_FIELDS) {
    if (typeof source[field] === 'string' && source[field] !== '') cached[field] = source[field]
  }

  if (Object.keys(cached).length > 0) localStorage.setItem('user', JSON.stringify(cached))
  else localStorage.removeItem('user')
}

/**
 * Moves existing admin-portal sessions into the neutral customer-app namespace.
 * Values are copied only when the neutral key is absent, then the legacy key is
 * removed so logout cannot accidentally resurrect an old session on reload.
 *
 * Some deployments already use the neutral key names. In that case the source
 * and destination are identical, so there is nothing to migrate and, critically,
 * we must not remove the live session key during application bootstrap.
 */
export function migrateLegacyCustomerStorage(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  for (const [legacyKey, customerKey] of Object.entries(LEGACY_TO_CUSTOMER_KEYS)) {
    if (legacyKey === 'access_token' || legacyKey === 'refresh_token') continue
    if (legacyKey === customerKey) continue

    const legacyValue = localStorage.getItem(legacyKey)
    if (legacyValue !== null && localStorage.getItem(customerKey) === null) {
      localStorage.setItem(customerKey, legacyValue)
    }
    localStorage.removeItem(legacyKey)
  }

  const verificationEmail = localStorage.getItem('verify_email')
  if (verificationEmail && !sessionStorage.getItem('verify_email')) {
    sessionStorage.setItem('verify_email', verificationEmail)
  }
  localStorage.removeItem('verify_email')

  const cachedUser = localStorage.getItem('user')
  if (cachedUser) {
    try {
      storeCachedCustomerUser(JSON.parse(cachedUser))
    } catch {
      localStorage.removeItem('user')
    }
  }
}
