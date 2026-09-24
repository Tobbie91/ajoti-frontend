import type { UserProfile } from '@/utils/api/auth-profile'

export const isDevAuthBypass =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === 'true'

export const DEV_AUTH_BYPASS_USER: UserProfile = {
  id: 'local-dev-auth-bypass-user',
  firstName: 'Local',
  lastName: 'Member',
  email: 'local-member@example.invalid',
  phone: '+2340000000000',
  role: 'MEMBER',
  status: 'ACTIVE',
}
