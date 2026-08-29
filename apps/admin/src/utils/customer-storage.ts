const LEGACY_TO_CUSTOMER_KEYS = {
  access_token: 'access_token',
  refresh_token: 'refresh_token',
  user: 'user',
  kyc_completed: 'kyc_completed',
  verify_email: 'verify_email',
} as const

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
  for (const [legacyKey, customerKey] of Object.entries(LEGACY_TO_CUSTOMER_KEYS)) {
    if (legacyKey === customerKey) continue

    const legacyValue = localStorage.getItem(legacyKey)
    if (legacyValue !== null && localStorage.getItem(customerKey) === null) {
      localStorage.setItem(customerKey, legacyValue)
    }
    localStorage.removeItem(legacyKey)
  }
}
