const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const { headers, ...rest } = options
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...headers },
  })

  const data = await res.json().catch(() => ({}))

  if (res.status === 401) {
    // Token expired or missing — clear session and redirect to login
    ;['admin_access_token', 'admin_refresh_token', 'admin_user', 'admin_kyc_completed', 'admin_verify_email'].forEach(
      (k) => localStorage.removeItem(k),
    )
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    const msg = (data as { message?: string | string[] }).message
    throw new Error(Array.isArray(msg) ? msg[0] : msg ?? 'Something went wrong')
  }

  return data as T
}

// ── Auth ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  dob: string           // "YYYY-MM-DD"
  gender: 'MALE' | 'FEMALE'
  phone: string
  password: string
  role?: string
}

export interface RegisterResponse {
  message: string
  userId?: string
}

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Login
export interface LoginResponse {
  user: {
    email: string
    firstname: string
    lastname: string
    DOB: string
    phone: string
  }
  accessToken: string
  refreshToken: string
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  dob: string
  phone: string
}

export async function login(email: string, password: string): Promise<{ token: string; refreshToken: string; user: UserProfile }> {
  const res = await fetch(`${BASE_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      email,
      password,
    }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = (data as { message?: string | string[] }).message
    throw new Error(Array.isArray(msg) ? msg[0] : msg ?? 'Invalid email or password')
  }

  const { accessToken, refreshToken, user: backendUser } = data as LoginResponse

  const user: UserProfile = {
    id: '',
    email: backendUser.email,
    firstName: backendUser.firstname,
    lastName: backendUser.lastname,
    dob: backendUser.DOB ? backendUser.DOB.split('T')[0] : '',
    phone: backendUser.phone || '',
  }

  return { token: accessToken, refreshToken, user }
}

// Verify email OTP
export interface VerifyEmailPayload {
  email: string
  otp: string
}

export function verifyEmail(payload: VerifyEmailPayload): Promise<{ message: string }> {
  return request('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Resend OTP
export function resendOtp(email: string): Promise<{ message: string }> {
  return request('/api/auth/resend-verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

// ── Authenticated requests ──────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function authRequest<T>(path: string, options: RequestInit): Promise<T> {
  return request(path, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  })
}

// ── KYC ─────────────────────────────────────────────────────────────────────

export interface VerifyNinPayload {
  nin: string
  firstName: string
  lastName: string
  dob: string
}

export function verifyNin(payload: VerifyNinPayload): Promise<{ message: string }> {
  return authRequest('/api/kyc/verify-nin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface VerifyBvnPayload {
  bvn: string
  firstName: string
  lastName: string
  dob: string
}

export function verifyBvn(payload: VerifyBvnPayload): Promise<{ message: string }> {
  return authRequest('/api/kyc/verify-bvn', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface SubmitNokPayload {
  nextOfKinName: string
  nextOfKinRelationship: string
  nextOfKinPhone: string
}

export function submitNok(payload: SubmitNokPayload): Promise<{ message: string }> {
  return authRequest('/api/kyc/submit-nok', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── Logout ──────────────────────────────────────────────────────────────────

export function logout(refreshToken: string): Promise<{ message: string }> {
  return authRequest('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

// ── Password ────────────────────────────────────────────────────────────────

export function forgotPassword(email: string): Promise<{ message: string }> {
  return request('/api/auth/forget-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPassword(payload: { email: string; otp: string; newPassword: string }): Promise<{ message: string }> {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── ROSCA (admin) ───────────────────────────────────────────────────────────

export interface RoscaCircle {
  id: string
  name: string
  description: string
  contributionAmount: number
  frequency: string
  durationCycles: number
  maxSlots: number
  totalSlots: number
  filledSlots: number
  status: string
  visibility: string
  collateralPercentage: number
  payoutLogic: string
  autoStartOnFull: boolean
  latePenaltyPercent: number
  admin: {
    firstName: string
    lastName: string
  }
  [key: string]: unknown
}

// GET /api/rosca — list circles the admin belongs to
export function listRoscaCircles(): Promise<RoscaCircle[]> {
  return authRequest('/api/rosca', { method: 'GET' })
}

// GET /api/admin/rosca/all — view all circles regardless of visibility
export function listAllRoscaCircles(): Promise<RoscaCircle[]> {
  return authRequest('/api/admin/rosca/all', { method: 'GET' })
}

// POST /api/admin/rosca — create a new ROSCA circle
export interface CreateRoscaPayload {
  name: string
  description: string
  contributionAmount: string
  frequency: 'MONTHLY' | 'WEEKLY' | 'BI_WEEKLY'
  durationCycles: number
  maxSlots: number
  collateralPercentage: number
  payoutLogic: string
  autoStartOnFull: boolean
  visibility: string
  latePenaltyPercent: number
}

export function createRoscaCircle(payload: CreateRoscaPayload): Promise<RoscaCircle> {
  return authRequest('/api/admin/rosca', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// PATCH /api/admin/rosca/{circleId}/activate — activate a circle
export function activateRoscaCircle(circleId: string, startDate: string): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/activate`, {
    method: 'PATCH',
    body: JSON.stringify({ startDate }),
  })
}

// PATCH /api/admin/rosca/{circleId}/members/{userId}/approve — approve a member
export function approveMember(circleId: string, userId: string): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/members/${userId}/approve`, {
    method: 'PATCH',
  })
}

// PATCH /api/admin/rosca/{circleId}/payout-config — update payout config
export function updatePayoutConfig(circleId: string, config: Record<string, unknown>): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/payout-config`, {
    method: 'PATCH',
    body: JSON.stringify(config),
  })
}

export interface RoscaSchedule {
  month: string
  recipient: string
  status: string
  [key: string]: unknown
}

export function getRoscaSchedules(circleId: string): Promise<RoscaSchedule[]> {
  return authRequest(`/api/rosca/${circleId}/schedules`, { method: 'GET' })
}

// ── Payouts ──────────────────────────────────────────────────────────────────

export interface Payout {
  id: string
  cycleNumber: number
  recipientId?: string
  recipientName?: string
  amount: number | string
  status: string
  createdAt?: string
  processedAt?: string
  [key: string]: unknown
}

export async function getPayoutHistory(circleId: string): Promise<Payout[]> {
  const res = await authRequest<{ data?: Payout[] } | Payout[]>(
    `/api/rosca/${circleId}/payouts`,
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: Payout[] }).data ?? []
}

export function processPayout(circleId: string, cycleNumber: number): Promise<{ message: string }> {
  return authRequest(`/api/admin/payouts/${circleId}/process/${cycleNumber}`, { method: 'POST' })
}

export function retryPayout(payoutId: string): Promise<{ message: string }> {
  return authRequest(`/api/admin/payouts/${payoutId}/retry`, { method: 'POST' })
}

export interface ReversePayoutPayload {
  originalPayoutId: string
  recipientId: string
  scheduleId: string
  amount: string
  reason: string
}

export function reversePayout(payload: ReversePayoutPayload): Promise<{ message: string }> {
  return authRequest('/api/admin/payouts/reverse', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function triggerPayoutScheduler(): Promise<{ message: string }> {
  return authRequest('/api/admin/payouts/trigger-scheduler', { method: 'POST' })
}

// ── Contributions ─────────────────────────────────────────────────────────────

export interface Contribution {
  id: string
  cycleNumber: number
  amount: number | string
  status: string
  createdAt?: string
  member?: { firstName?: string; lastName?: string; [key: string]: unknown }
  [key: string]: unknown
}

export async function getCircleContributions(circleId: string): Promise<Contribution[]> {
  const res = await authRequest<{ data?: Contribution[] } | Contribution[]>(
    `/api/rosca/${circleId}/contributions`,
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: Contribution[] }).data ?? []
}

export function makeContribution(circleId: string, cycleNumber: number): Promise<{ message: string }> {
  return authRequest(`/api/rosca/${circleId}/contributions`, {
    method: 'POST',
    body: JSON.stringify({ cycleNumber }),
  })
}
