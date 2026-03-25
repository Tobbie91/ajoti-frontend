const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const { headers, ...rest } = options
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...headers },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = (data as { message?: string | string[] }).message
    throw new Error(Array.isArray(msg) ? msg[0] : msg ?? 'Something went wrong')
  }

  return data as T
}

// ── Auth ────────────────────────────────────────────────────────────────────

// Register
export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  dob: string           // "YYYY-MM-DD"
  gender: 'MALE' | 'FEMALE'
  phone: string
  password: string
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
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function authRequest<T>(path: string, options: RequestInit): Promise<T> {
  return request(path, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  })
}

// ── KYC ─────────────────────────────────────────────────────────────────────

export interface KycStatus {
  ninVerified: boolean
  bvnVerified: boolean
  nokSubmitted: boolean
  status: string  // e.g. "PENDING", "APPROVED", "REJECTED"
}

export function getKycStatus(): Promise<KycStatus> {
  return authRequest('/api/kyc/status', { method: 'GET' })
}

export interface VerifyNinPayload {
  nin: string
  firstName: string
  lastName: string
  dob: string  // "YYYY-MM-DD"
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
  dob: string  // "YYYY-MM-DD"
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

export function resendResetOtp(email: string): Promise<{ message: string }> {
  return request('/api/auth/resend-reset-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export interface ResetPasswordPayload {
  email: string
  otp: string
  newPassword: string
}

export function resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
}

export function changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
  return authRequest('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── ROSCA ────────────────────────────────────────────────────────────────────

export interface RoscaCircle {
  id: string
  name: string
  contributionAmount: string | number
  frequency: string
  durationCycles: number
  maxSlots: number
  filledSlots: number
  status: string
  visibility: string
  admin?: {
    firstName: string
    lastName: string
  }
  [key: string]: unknown
}

export async function listRoscaCircles(): Promise<RoscaCircle[]> {
  const res = await authRequest<{ data?: RoscaCircle[] } | RoscaCircle[]>('/api/rosca', { method: 'GET' })
  return Array.isArray(res) ? res : (res as { data?: RoscaCircle[] }).data ?? []
}

export function joinRoscaCircle(circleId: string): Promise<{ message: string }> {
  return authRequest(`/api/rosca/${circleId}/join`, { method: 'POST' })
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

// ── Wallet ──────────────────────────────────────────────────────────────────

export interface Wallet {
  id: string
  balance: number
  currency: string
  [key: string]: unknown
}

export function getWallet(): Promise<Wallet> {
  return authRequest('/api/wallet', { method: 'GET' })
}

export function getWalletBalance(): Promise<{ balance: number }> {
  return authRequest('/api/wallet/balance', { method: 'GET' })
}

export function getWalletBalanceNaira(): Promise<Record<string, unknown>> {
  return authRequest('/api/wallet/balance/naira', { method: 'GET' })
}

export interface WalletBucket {
  name: string
  amount: number
  [key: string]: unknown
}

export function getWalletBuckets(): Promise<WalletBucket[]> {
  return authRequest('/api/wallet/buckets', { method: 'GET' })
}

export interface WalletStatistics {
  totalInflow: number
  totalOutflow: number
  [key: string]: unknown
}

export function getWalletStatistics(): Promise<WalletStatistics> {
  return authRequest('/api/wallet/statistics', { method: 'GET' })
}

export function getWalletStatus(): Promise<{ status: string; [key: string]: unknown }> {
  return authRequest('/api/wallet/status', { method: 'GET' })
}

export function checkSufficientBalance(amount: number): Promise<{ sufficient: boolean }> {
  return authRequest(`/api/wallet/balance/check/${amount}`, { method: 'GET' })
}

export interface WalletTransaction {
  id: string
  type: string
  amount: number
  description: string
  createdAt: string
  [key: string]: unknown
}

export function getWalletTransactions(): Promise<WalletTransaction[]> {
  return authRequest('/api/wallet/transactions', { method: 'GET' })
}

export interface VirtualAccount {
  id: string
  accountNumber: string
  bankName: string
  accountName: string
  currency: string
  isActive: boolean
  [key: string]: unknown
}

export async function getVirtualAccount(): Promise<VirtualAccount> {
  const res = await authRequest<{ data?: VirtualAccount } | VirtualAccount>('/api/wallet/virtual-account', { method: 'GET' })
  return ('data' in res && res.data ? res.data : res) as VirtualAccount
}

// ── Wallet Funding ────────────────────────────────────────────────────────────

export interface FundingMethod {
  method: string
  label: string
  [key: string]: unknown
}

export interface FundingInitResponse {
  paymentLink?: string
  paymentUrl?: string
  reference?: string
  [key: string]: unknown
}

export async function getFundingMethods(): Promise<FundingMethod[]> {
  const res = await authRequest<{ data?: FundingMethod[] } | FundingMethod[]>('/api/wallet/funding/methods', { method: 'GET' })
  return Array.isArray(res) ? res : (res as { data?: FundingMethod[] }).data ?? []
}

export async function initializeFunding(payload: {
  amount: number
  redirectUrl: string
  paymentMethod: string
  currency?: string
}): Promise<FundingInitResponse> {
  const res = await authRequest<{ data?: FundingInitResponse } | FundingInitResponse>('/api/wallet/funding/initialize', {
    method: 'POST',
    body: JSON.stringify({ currency: 'NGN', ...payload }),
  })
  return ('data' in res && res.data ? res.data : res) as FundingInitResponse
}

// ── Withdrawal ────────────────────────────────────────────────────────────────

export interface WithdrawalPayload {
  amount: number
  accountNumber: string
  bankCode: string
  bankName?: string
  currency?: string
  narration?: string
}

export interface WithdrawalResponse {
  reference?: string
  status?: string
  message?: string
  [key: string]: unknown
}

export async function initializeWithdrawal(payload: WithdrawalPayload): Promise<WithdrawalResponse> {
  const res = await authRequest<{ data?: WithdrawalResponse } | WithdrawalResponse>(
    '/api/wallet/withdrawal/initialize',
    {
      method: 'POST',
      body: JSON.stringify({ currency: 'NGN', ...payload }),
    },
  )
  return ('data' in res && res.data ? res.data : res) as WithdrawalResponse
}

// ── Trust Score ───────────────────────────────────────────────────────────────

export interface TrustScore {
  score: number
  tier?: string
  totalContributions?: number
  onTimePayments?: number
  latePayments?: number
  [key: string]: unknown
}

export async function getTrustScore(): Promise<TrustScore> {
  const res = await authRequest<{ data?: TrustScore } | TrustScore>('/api/trust/my-score', { method: 'GET' })
  return ('data' in res && res.data ? res.data : res) as TrustScore
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export function handleFlutterwaveWebhook(payload: Record<string, unknown>): Promise<{ message: string }> {
  return request('/api/webhooks/flutterwave', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
  [key: string]: unknown
}

export async function getNotifications(): Promise<AppNotification[]> {
  const res = await authRequest<{ data?: AppNotification[] } | AppNotification[]>('/api/notifications', { method: 'GET' })
  return Array.isArray(res) ? res : (res as { data?: AppNotification[] }).data ?? []
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await authRequest<{ count?: number; unreadCount?: number } | number>('/api/notifications/unread-count', { method: 'GET' })
  if (typeof res === 'number') return res
  return (res as { count?: number; unreadCount?: number }).count ?? (res as { count?: number; unreadCount?: number }).unreadCount ?? 0
}

export function markNotificationRead(id: string): Promise<{ message: string }> {
  return authRequest(`/api/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllNotificationsRead(): Promise<{ message: string }> {
  return authRequest('/api/notifications/read-all', { method: 'PATCH' })
}
