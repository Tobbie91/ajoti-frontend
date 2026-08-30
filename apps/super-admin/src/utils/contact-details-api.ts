import { createApiClient } from '@ajoti/shared'

const client = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  storagePrefix: 'superadmin_',
})

export interface ContactDetailsUpdate {
  firstName?: string
  lastName?: string
  dob?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  lga?: string
  reason: string
}

export function updateUserContactDetails(userId: string, data: ContactDetailsUpdate) {
  return client.authRequest<{ success: boolean; message: string; data: Record<string, string | null> }>(
    `/api/superadmin/users/${userId}/contact-details`,
    { method: 'PATCH', body: JSON.stringify(data) },
  )
}
