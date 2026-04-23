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

// ── Token refresh ────────────────────────────────────────────────────────────

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

async function tryRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) throw new Error('No refresh token')

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!res.ok) throw new Error('Refresh failed')

  const data = await res.json() as { accessToken: string; refreshToken: string }
  localStorage.setItem('access_token', data.accessToken)
  localStorage.setItem('refresh_token', data.refreshToken)
  return data.accessToken
}

function clearSessionAndRedirect() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  window.location.href = '/'
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
  phone?: string
  address?: string
  city?: string
  state?: string
  lga?: string
  role?: string
  adminRequestedAt?: string | null
  [key: string]: unknown
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await authRequest<{ data?: UserProfile } | UserProfile>('/api/users/me', { method: 'GET' })
  return ('data' in res && res.data ? res.data : res) as UserProfile
}

export async function updateUserProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
  const res = await authRequest<{ data?: UserProfile } | UserProfile>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return ('data' in res && res.data ? res.data : res) as UserProfile
}

export async function login(email: string, password: string): Promise<{ token: string; refreshToken: string; user: UserProfile }> {
  const res = await fetch(`${BASE_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', email, password }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = (data as { message?: string | string[] }).message
    throw new Error(Array.isArray(msg) ? msg[0] : msg ?? 'Invalid email or password')
  }

  // Handle both wrapped { data: {...} } and flat response shapes
  const raw = (data as Record<string, unknown>)
  const payload = (raw.data ?? raw) as Record<string, unknown>

  const token = (payload.accessToken ?? payload.token ?? payload.access_token ?? '') as string
  const refreshToken = (payload.refreshToken ?? payload.refresh_token ?? '') as string
  const backendUser = (payload.user ?? payload.profile ?? {}) as Record<string, unknown>

  const user: UserProfile = {
    id: (backendUser.id ?? backendUser._id ?? '') as string,
    email: (backendUser.email ?? email) as string,
    firstName: (backendUser.firstName ?? backendUser.firstname ?? '') as string,
    lastName: (backendUser.lastName ?? backendUser.lastname ?? '') as string,
    dob: backendUser.DOB ? (backendUser.DOB as string).split('T')[0] : (backendUser.dob as string ?? ''),
  }

  return { token, refreshToken, user }
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

function authHeaders(token?: string): Record<string, string> {
  const t = token ?? localStorage.getItem('access_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function authRequest<T>(path: string, options: RequestInit): Promise<T> {
  const { headers, ...rest } = options
  const isFormData = options.body instanceof FormData
  const contentTypeHeader: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' }

  // First attempt
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { ...contentTypeHeader, ...authHeaders(), ...(headers as Record<string, string> | undefined) } as Record<string, string>,
  })

  if (res.status !== 401) {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = (data as { message?: string | string[] }).message
      throw new Error(Array.isArray(msg) ? msg[0] : msg ?? 'Something went wrong')
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

      // Retry with new token
      return request<T>(path, {
        ...options,
        headers: { ...authHeaders(newToken), ...headers },
      })
    } catch {
      refreshQueue = []
      isRefreshing = false
      clearSessionAndRedirect()
      throw new Error('Session expired. Please log in again.')
    }
  }

  // Another request is already refreshing — wait for it
  return new Promise<T>((resolve, reject) => {
    refreshQueue.push((newToken) => {
      resolve(
        request<T>(path, {
          ...options,
          headers: { ...authHeaders(newToken), ...headers },
        }),
      )
    })
    // If refresh ultimately fails the queue gets cleared and this will never resolve,
    // but clearSessionAndRedirect() will navigate away anyway.
    setTimeout(() => reject(new Error('Session expired')), 10_000)
  })
}

// ── KYC ─────────────────────────────────────────────────────────────────────

export interface KycStatus {
  ninVerified: boolean
  bvnVerified: boolean
  nokSubmitted: boolean
  status: string  // e.g. "NOT_SUBMITTED", "PENDING", "APPROVED", "REJECTED"
  step?: string   // e.g. "NIN_REQUIRED", "BVN_REQUIRED", "NOK_REQUIRED", "SUBMITTED", "PHOTO_REQUIRED", "PROOF_OF_ADDRESS_REQUIRED"
  kycLevel: number  // 0 = none, 1 = NIN+BVN+NOK, 2 = +GovID, 3 = +ProofOfAddress
  rejectionReason?: string | null
}

export function getKycStatus(): Promise<KycStatus> {
  return authRequest('/api/kyc/status', { method: 'GET' })
}

export function resubmitKyc(): Promise<KycStatus> {
  return authRequest('/api/kyc/resubmit', { method: 'POST' })
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

export interface SubmitPhotoPayload {
  governmentIdType: string
  address: string
  city: string
  state: string
  lga?: string
  country: string
  selfie: File
  governmentIdFront: File
  governmentIdBack?: File
}

export function submitPhoto(payload: SubmitPhotoPayload): Promise<KycStatus> {
  const form = new FormData()
  form.append('governmentIdType', payload.governmentIdType)
  form.append('address', payload.address)
  form.append('city', payload.city)
  form.append('state', payload.state)
  form.append('country', payload.country)
  if (payload.lga) form.append('lga', payload.lga)
  form.append('selfie', payload.selfie)
  form.append('governmentIdFront', payload.governmentIdFront)
  if (payload.governmentIdBack) form.append('governmentIdBack', payload.governmentIdBack)
  return authRequest('/api/kyc/submit-photo', { method: 'POST', body: form })
}

export interface SubmitProofOfAddressPayload {
  proofOfAddressType: string
  proofOfAddress: File
}

export function submitProofOfAddress(payload: SubmitProofOfAddressPayload): Promise<KycStatus> {
  const form = new FormData()
  form.append('proofOfAddressType', payload.proofOfAddressType)
  form.append('proofOfAddress', payload.proofOfAddress)
  return authRequest('/api/kyc/submit-proof-of-address', { method: 'POST', body: form })
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

export interface MyJoinRequest {
  membershipId: string
  circleId: string
  status: string
  requestedAt?: string
  collateralReserved?: string
  circle?: {
    id?: string
    name?: string
    durationCycles?: number
    filledSlots?: number
    maxSlots?: number
    frequency?: string
    contributionAmount?: number | string
    nextPayoutDate?: string
    admin?: { firstName?: string; lastName?: string }
  }
  [key: string]: unknown
}

export async function getMyJoinRequests(): Promise<MyJoinRequest[]> {
  const res = await authRequest<{ data?: MyJoinRequest[] } | MyJoinRequest[]>(
    '/api/rosca/my-join-requests',
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: MyJoinRequest[] }).data ?? []
}

// GET /api/rosca/my-participations — circles the user is actively participating in
export async function getMyParticipations(): Promise<RoscaCircle[]> {
  const res = await authRequest<{ data?: RoscaCircle[] } | RoscaCircle[]>(
    '/api/rosca/my-participations',
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: RoscaCircle[] }).data ?? []
}

export interface RoscaSchedule {
  id?: string
  cycleNumber?: number
  contributionDeadline?: string
  payoutDate?: string
  recipientId?: string | null
  status: string
  // legacy fields (used in GroupDetails payout table)
  month?: string
  recipient?: string
  [key: string]: unknown
}

export async function getRoscaSchedules(circleId: string): Promise<RoscaSchedule[]> {
  const res = await authRequest<{ data?: RoscaSchedule[] } | RoscaSchedule[]>(
    `/api/rosca/${circleId}/schedules`,
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: RoscaSchedule[] }).data ?? []
}

export async function getRoscaCircle(circleId: string): Promise<RoscaCircle> {
  const res = await authRequest<{ data?: RoscaCircle } | RoscaCircle>(
    `/api/rosca/${circleId}`,
    { method: 'GET' },
  )
  return ('data' in res && res.data ? res.data : res) as RoscaCircle
}

export interface CircleContribution {
  id: string
  cycleNumber: number
  amount: string
  penaltyAmount: string
  paidAt: string
}

export async function getCircleContributions(circleId: string): Promise<CircleContribution[]> {
  const res = await authRequest<{ data?: CircleContribution[] } | CircleContribution[]>(
    `/api/rosca/${circleId}/contributions`,
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: CircleContribution[] }).data ?? []
}

export async function makeContribution(circleId: string, cycleNumber: number): Promise<CircleContribution> {
  const res = await authRequest<{ data?: CircleContribution } | CircleContribution>(
    `/api/rosca/${circleId}/contributions`,
    { method: 'POST', body: JSON.stringify({ cycleNumber }) },
  )
  return ('data' in res && res.data ? res.data : res) as CircleContribution
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

export interface WalletBalance {
  total: string
  reserved: string
  available: string
  currency: string
}

export async function getWalletBalance(): Promise<WalletBalance> {
  const res = await authRequest<{ data?: WalletBalance } | WalletBalance>('/api/wallet/balance', { method: 'GET' })
  return ('data' in res && res.data ? res.data : res) as WalletBalance
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
  entryType: string       // CREDIT | DEBIT | RESERVE
  movementType: string    // FUNDING | TRANSFER | etc.
  bucketType: string | null
  amount: string | number
  balanceBefore?: string | number
  balanceAfter?: string | number
  createdAt: string
  metadata?: Record<string, unknown>
  sourceType?: string
  // legacy/fallback fields
  type?: string
  description?: string
  [key: string]: unknown
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  const res = await authRequest<{ data?: WalletTransaction[] } | WalletTransaction[]>('/api/wallet/transactions', { method: 'GET' })
  return Array.isArray(res) ? res : (res as { data?: WalletTransaction[] }).data ?? []
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
  id: string
  name: string
  icon: string
  fee: number
  minAmount: number
  description: string
}

export interface FundingInitResponse {
  authorizationUrl?: string
  paymentLink?: string
  paymentUrl?: string
  link?: string
  reference?: string
  [key: string]: unknown
}

export async function getFundingMethods(): Promise<FundingMethod[]> {
  const res = await authRequest<unknown>('/api/wallet/funding/methods', { method: 'GET' })
  // Response: { success, data: { methods: [...] } }
  if (Array.isArray(res)) return res as FundingMethod[]
  const data = (res as Record<string, unknown>).data
  if (Array.isArray(data)) return data as FundingMethod[]
  if (data && typeof data === 'object') {
    const methods = (data as Record<string, unknown>).methods
    if (Array.isArray(methods)) return methods as FundingMethod[]
  }
  return []
}

export function verifyFunding(reference: string): Promise<Record<string, unknown>> {
  return authRequest(`/api/wallet/funding/verify/${reference}`, { method: 'GET' })
}

export async function initializeFunding(payload: {
  amount: number
  redirectUrl: string
  paymentMethod?: string
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
  amount: number        // naira — will be multiplied × 100 to kobo before sending
  accountNumber: string
  accountName: string
  bankCode: string
  bankName?: string
  narration?: string
  transactionPin: string
}

export interface WithdrawalResponse {
  reference?: string
  status?: string
  message?: string
  [key: string]: unknown
}

export async function initializeWithdrawal(payload: WithdrawalPayload): Promise<WithdrawalResponse> {
  const { amount, ...rest } = payload
  const res = await authRequest<{ data?: WithdrawalResponse } | WithdrawalResponse>(
    '/api/wallet/withdrawal/initialize',
    {
      method: 'POST',
      body: JSON.stringify({ ...rest, amount: amount * 100 }), // convert naira → kobo
    },
  )
  return ('data' in res && res.data ? res.data : res) as WithdrawalResponse
}

// ── Transaction PIN ───────────────────────────────────────────────────────────

export function setTransactionPin(pin: string, currentPin?: string): Promise<{ message: string }> {
  return authRequest('/api/users/me/pin', {
    method: 'POST',
    body: JSON.stringify({ pin, ...(currentPin ? { currentPin } : {}) }),
  })
}

export function getPinStatus(): Promise<{ hasPin: boolean }> {
  return authRequest('/api/users/me/pin/status', { method: 'GET' })
}

// ── Trust Score ───────────────────────────────────────────────────────────────

export interface ATIBreakdown {
  recentBehavior: number
  historyBehavior: number
  payoutReliability: number
  peerScore: number
  historyLength: number
  weights: {
    recentBehavior: number
    historyBehavior: number
    payoutReliability: number
    peerScore: number
    historyLength: number
  }
}

export interface TrustScore {
  userId?: string
  trustScore: number
  displayScore?: number
  totalExpectedPayments?: number
  totalOnTimePayments?: number
  totalLatePayments?: number
  totalMissedPayments?: number
  totalDefaults?: number
  totalPeerRatings?: number
  averagePeerRating?: number
  atiBreakdown?: ATIBreakdown | null
}

export async function getTrustScore(): Promise<TrustScore> {
  const res = await authRequest<{ data?: TrustScore } | TrustScore>('/api/trust/my-score', { method: 'GET' })
  return ('data' in res && res.data ? res.data : res) as TrustScore
}

// ── Loans ─────────────────────────────────────────────────────────────────────

export interface LoanEligibility {
  eligible: boolean
  reason?: string
  ineligibilityReason?: string
  maxLoanAmount?: string
  expectedPayoutAmount?: string
  feeRate?: number
  [key: string]: unknown
}

export async function getLoanEligibility(circleId: string): Promise<LoanEligibility> {
  const res = await authRequest<{ data?: LoanEligibility } | LoanEligibility>(
    `/api/loan/eligibility?circleId=${circleId}`,
    { method: 'GET' },
  )
  return ('data' in res && res.data ? res.data : res) as LoanEligibility
}

export interface LoanApplication {
  circleId: string
}

export interface Loan {
  id: string
  circleId: string
  circleName?: string
  amount: number | string
  feeAmount?: number | string
  disbursedAmount?: number | string
  status: string
  createdAt: string
  dueDate?: string
  disbursedAt?: string
  [key: string]: unknown
}

export async function applyForLoan(payload: LoanApplication): Promise<Loan> {
  const res = await authRequest<{ data?: Loan } | Loan>('/api/loan/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return ('data' in res && res.data ? res.data : res) as Loan
}

export async function getLoanStatus(): Promise<Loan | null> {
  try {
    const res = await authRequest<{ data?: Loan } | Loan>('/api/loan/status', { method: 'GET' })
    return ('data' in res && res.data ? res.data : res) as Loan
  } catch {
    return null
  }
}

export async function getLoanHistory(): Promise<Loan[]> {
  const res = await authRequest<{ data?: Loan[] } | Loan[]>('/api/loan/history', { method: 'GET' })
  return Array.isArray(res) ? res : (res as { data?: Loan[] }).data ?? []
}

// ── Credit Score ──────────────────────────────────────────────────────────────

export interface CreditScore {
  score: number
  compositeScore?: number
  tier?: string
  [key: string]: unknown
}

export async function getCreditScore(): Promise<CreditScore> {
  const res = await authRequest<{ data?: CreditScore } | CreditScore>('/api/credit-score', { method: 'GET' })
  return ('data' in res && res.data ? res.data : res) as CreditScore
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
  actionUrl?: string | null
  [key: string]: unknown
}

export interface PendingInvite {
  id: string
  token: string
  email: string
  expiresAt: string
  createdAt: string
  circle: {
    id: string
    name: string
    contributionAmount: string
    frequency: string
    durationCycles: number
    maxSlots: number
    filledSlots: number
    admin: { firstName: string; lastName: string }
  }
}

export async function getMyInvites(): Promise<PendingInvite[]> {
  const res = await authRequest<{ data?: PendingInvite[] } | PendingInvite[]>(
    '/api/rosca/my-invites',
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: PendingInvite[] }).data ?? []
}

export async function joinByInvite(token: string): Promise<{ message: string }> {
  return authRequest('/api/rosca/join-by-invite', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function getNotifications(): Promise<AppNotification[]> {
  const res = await authRequest<{ data?: unknown[] } | unknown[]>('/api/notifications', { method: 'GET' })
  const raw: unknown[] = Array.isArray(res) ? res : ((res as { data?: unknown[] }).data ?? [])
  // Normalize backend field names: body→message, isRead→read
  return raw.map((n: unknown) => {
    const r = n as Record<string, unknown>
    return {
      ...r,
      message: (r.message ?? r.body ?? '') as string,
      read: (r.read ?? r.isRead ?? false) as boolean,
      actionUrl: (r.actionUrl ?? null) as string | null,
    } as AppNotification
  })
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

// ── Peer Reviews ──────────────────────────────────────────────────────────────

export interface CircleMember {
  userId: string
  name: string
  firstName?: string
  lastName?: string
  position?: number
  status?: string
  joinedAt?: string
  trustScore?: number
  [key: string]: unknown
}

export async function getCircleMembers(circleId: string): Promise<CircleMember[]> {
  const res = await authRequest<{ data?: CircleMember[] } | CircleMember[]>(
    `/api/rosca/${circleId}/members`,
    { method: 'GET' },
  )
  const list = Array.isArray(res) ? res : (res as { data?: CircleMember[] }).data ?? []
  return list
}

export interface PeerReview {
  id: string
  circleId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment?: string
  createdAt: string
  reviewee?: { firstName?: string; lastName?: string; [key: string]: unknown }
  reviewer?: { firstName?: string; lastName?: string; [key: string]: unknown }
  [key: string]: unknown
}

export async function submitPeerReview(circleId: string, payload: {
  revieweeId: string
  rating: number
  comment?: string
}): Promise<{ message: string }> {
  return authRequest(`/api/rosca/${circleId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getCirclePeerReviews(circleId: string): Promise<PeerReview[]> {
  const res = await authRequest<{ data?: PeerReview[] } | PeerReview[]>(
    `/api/rosca/${circleId}/peer-reviews`,
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: PeerReview[] }).data ?? []
}

// ── Admin Access Request ──────────────────────────────────────────────────────

export function requestAdminAccess(): Promise<{ message: string }> {
  return authRequest('/api/users/me/request-admin', { method: 'POST' })
}
