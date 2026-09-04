const CACHED_STAFF_FIELDS = ['id', 'firstName', 'lastName', 'role', 'staffRole'] as const

export function storeCachedStaffUser(value: unknown): void {
  if (!value || typeof value !== 'object') {
    localStorage.removeItem('superadmin_user')
    return
  }

  const source = value as Record<string, unknown>
  const cached: Record<string, string> = {}
  for (const field of CACHED_STAFF_FIELDS) {
    if (typeof source[field] === 'string' && source[field] !== '') cached[field] = source[field]
  }

  if (Object.keys(cached).length > 0) localStorage.setItem('superadmin_user', JSON.stringify(cached))
  else localStorage.removeItem('superadmin_user')
}

export function sanitizeCachedStaffUser(): void {
  const stored = localStorage.getItem('superadmin_user')
  if (!stored) return

  try {
    storeCachedStaffUser(JSON.parse(stored))
  } catch {
    localStorage.removeItem('superadmin_user')
  }
}
