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
  const refreshToken = localStorage.getItem('admin_refresh_token')
  if (!refreshToken) throw new Error('No refresh token')

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!res.ok) throw new Error('Refresh failed')

  const data = await res.json() as { accessToken: string; refreshToken: string }
  localStorage.setItem('admin_access_token', data.accessToken)
  localStorage.setItem('admin_refresh_token', data.refreshToken)
  return data.accessToken
}

function clearSessionAndRedirect() {
  ;['admin_access_token', 'admin_refresh_token', 'admin_user', 'admin_kyc_completed', 'admin_verify_email'].forEach(
    (k) => localStorage.removeItem(k),
  )
  window.location.href = '/login'
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

  const raw = data as Record<string, unknown>
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
    phone: (backendUser.phone ?? '') as string,
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
  const t = token ?? localStorage.getItem('admin_access_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function authRequest<T>(path: string, options: RequestInit): Promise<T> {
  const { headers, ...rest } = options

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...headers },
  })

  if (res.status !== 401) {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = (data as { message?: string | string[] }).message
      throw new Error(Array.isArray(msg) ? msg[0] : msg ?? 'Something went wrong')
    }
    return data as T
  }

  // 401 — attempt token refresh
  if (!isRefreshing) {
    isRefreshing = true
    try {
      const newToken = await tryRefresh()
      refreshQueue.forEach((resolve) => resolve(newToken))
      refreshQueue = []
      isRefreshing = false

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

  return new Promise<T>((resolve, reject) => {
    refreshQueue.push((newToken) => {
      resolve(
        request<T>(path, {
          ...options,
          headers: { ...authHeaders(newToken), ...headers },
        }),
      )
    })
    setTimeout(() => reject(new Error('Session expired')), 10_000)
  })
}

// ── KYC ─────────────────────────────────────────────────────────────────────

export interface KycStatus {
  ninVerified: boolean
  bvnVerified: boolean
  nokSubmitted: boolean
  status: string // "PENDING" | "APPROVED" | "REJECTED"
}

export function getKycStatus(): Promise<KycStatus> {
  return authRequest('/api/kyc/status', { method: 'GET' })
}

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

// ── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dob?: string
  address?: string
  city?: string
  state?: string
  lga?: string
  role?: string
  [key: string]: unknown
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await authRequest<{ data?: UserProfile } | UserProfile>('/api/users/me', { method: 'GET' })
  return ('data' in res && res.data ? res.data : res) as UserProfile
}

export function updateUserProfile(payload: Partial<UserProfile>): Promise<{ message: string; data?: UserProfile }> {
  return authRequest('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ── KYC Admin ────────────────────────────────────────────────────────────────

export interface PendingKycRecord {
  userId: string
  name: string
  email: string
  submittedAt: string | null
  ninVerifiedAt: string | null
  bvnVerifiedAt: string | null
  nokSubmitted: boolean
}

export function listPendingKyc(): Promise<PendingKycRecord[]> {
  return authRequest('/api/kyc/pending', { method: 'GET' })
}

export function approveKyc(userId: string): Promise<KycStatus> {
  return authRequest(`/api/kyc/approve/${userId}`, { method: 'PATCH' })
}

export function rejectKyc(userId: string, rejectionReason: string): Promise<KycStatus> {
  return authRequest(`/api/kyc/reject/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ rejectionReason }),
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

// GET /api/admin/rosca/my-circles — view admin's own circles
export function listAllRoscaCircles(): Promise<RoscaCircle[]> {
  return authRequest('/api/admin/rosca/my-circles', { method: 'GET' })
}

// GET /api/admin/rosca/{circleId} — get circle details
export async function getAdminCircleDetail(circleId: string): Promise<RoscaCircle> {
  const res = await authRequest<{ data?: RoscaCircle } | RoscaCircle>(`/api/admin/rosca/${circleId}`, { method: 'GET' })
  return ('data' in res && res.data ? res.data : res) as RoscaCircle
}

// POST /api/admin/rosca — create a new ROSCA circle
export interface CreateRoscaPayload {
  name: string
  description: string
  contributionAmount: string
  frequency: 'MONTHLY' | 'WEEKLY' | 'BI_WEEKLY'
  durationCycles: number
  maxSlots: number
  payoutLogic: string
  autoStartOnFull: boolean
  visibility: string
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

// GET /api/admin/rosca/dashboard — admin dashboard stats
export interface AdminDashboard {
  totalGroups: number
  nextDeadline: { groupName: string; deadline: string } | null
  pendingJoinRequests: {
    total: number
    breakdown: { groupName: string; pendingCount: number }[]
  }
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const res = await authRequest<{ data?: AdminDashboard } | AdminDashboard>(
    '/api/admin/rosca/dashboard',
    { method: 'GET' },
  )
  return ('data' in res && res.data ? res.data : res) as AdminDashboard
}

// GET /api/admin/rosca/join-requests — list circles with pending join requests
export interface CirclePendingRequests {
  circleId: string
  name: string
  pendingCount: number
  oldestRequestAt: string
}

export async function getJoinRequests(): Promise<CirclePendingRequests[]> {
  const res = await authRequest<{ data?: CirclePendingRequests[] } | CirclePendingRequests[]>(
    '/api/admin/rosca/join-requests',
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: CirclePendingRequests[] }).data ?? []
}

export interface JoinRequesterDossier {
  userId: string
  membershipId: string
  name: string
  requestedAt: string
  trustScore: number
  onTimePaymentRate: number | null
  completedCycles: number
}

export async function getCircleJoinRequests(circleId: string): Promise<JoinRequesterDossier[]> {
  const res = await authRequest<{ data?: JoinRequesterDossier[] } | JoinRequesterDossier[]>(
    `/api/admin/rosca/${circleId}/join-requests`,
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: JoinRequesterDossier[] }).data ?? []
}

// PATCH /api/admin/rosca/{circleId}/members/{userId}/approve — approve a member
export function approveMember(circleId: string, userId: string): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/members/${userId}/approve`, {
    method: 'PATCH',
  })
}

// PATCH /api/admin/rosca/{circleId}/members/{userId}/reject — reject a member
export function rejectMember(circleId: string, userId: string): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/members/${userId}/reject`, {
    method: 'PATCH',
  })
}

// GET /api/admin/rosca/{circleId}/payout-config — get current payout config
export interface PayoutAssignment {
  userId: string
  name: string
  position: number | null
}

export interface PayoutConfig {
  payoutLogic: string
  allAssigned: boolean
  assignments: PayoutAssignment[]
}

export async function getPayoutConfig(circleId: string): Promise<PayoutConfig> {
  const res = await authRequest<{ data?: PayoutConfig } | PayoutConfig>(
    `/api/admin/rosca/${circleId}/payout-config`,
    { method: 'GET' },
  )
  return ('data' in res && res.data ? res.data : res) as PayoutConfig
}

// PATCH /api/admin/rosca/{circleId}/payout-config — update payout config
export function updatePayoutConfig(
  circleId: string,
  config: { payoutLogic?: string; assignments: { userId: string; position: number }[] },
): Promise<{ message: string }> {
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

// GET /api/admin/rosca/{circleId}/disbursements — admin view of disbursements
export interface Disbursement {
  id: string
  amount: number | string
  status: string
  createdAt?: string
  disbursedAt?: string
  paymentMethod?: string
  recipient?: { firstName?: string; lastName?: string }
  member?: { firstName?: string; lastName?: string }
  [key: string]: unknown
}

export async function getAdminDisbursements(circleId: string): Promise<Disbursement[]> {
  const res = await authRequest<{ data?: Disbursement[] } | Disbursement[]>(
    `/api/admin/rosca/${circleId}/disbursements`,
    { method: 'GET' },
  )
  const raw = Array.isArray(res) ? res : (res as { data?: Disbursement[] }).data ?? []
  return Array.isArray(raw) ? raw : []
}

// GET /api/admin/rosca/{circleId}/contributions — admin view of contributions
export async function getAdminCircleContributions(circleId: string): Promise<Contribution[]> {
  const res = await authRequest<{ data?: Contribution[] } | Contribution[]>(
    `/api/admin/rosca/${circleId}/contributions`,
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

// ── Wallet Transactions ───────────────────────────────────────────────────────

export interface WalletTransaction {
  id: string
  type: string
  amount: number
  description: string
  createdAt: string
  [key: string]: unknown
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  const res = await authRequest<{ data?: WalletTransaction[] } | WalletTransaction[]>(
    '/api/wallet/transactions',
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: WalletTransaction[] }).data ?? []
}

// ── Admin Wallet ─────────────────────────────────────────────────────────────

export interface AdminWalletBalance {
  total: number
  reserved: number
  available: number
  currency: string
}

export async function getAdminWalletBalance(userId: string): Promise<AdminWalletBalance> {
  const res = await authRequest<{ data?: AdminWalletBalance } | AdminWalletBalance>(
    `/api/admin/wallet/user/${userId}`,
    { method: 'GET' },
  )
  return ('data' in res && res.data ? res.data : res) as AdminWalletBalance
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

// ── Wallet Funding ────────────────────────────────────────────────────────────

export interface FundingInitResponse {
  authorizationUrl?: string
  paymentLink?: string
  paymentUrl?: string
  link?: string
  reference?: string
  [key: string]: unknown
}

export async function initializeFunding(payload: {
  amount: number
  redirectUrl: string
  currency?: string
}): Promise<FundingInitResponse> {
  const res = await authRequest<{ data?: FundingInitResponse } | FundingInitResponse>(
    '/api/wallet/funding/initialize',
    { method: 'POST', body: JSON.stringify({ currency: 'NGN', ...payload }) },
  )
  return ('data' in res && res.data ? res.data : res) as FundingInitResponse
}

export function verifyFunding(reference: string): Promise<Record<string, unknown>> {
  return authRequest(`/api/wallet/funding/verify/${reference}`, { method: 'GET' })
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

export async function initializeWithdrawal(payload: WithdrawalPayload): Promise<Record<string, unknown>> {
  const { amount, ...rest } = payload
  const res = await authRequest<{ data?: Record<string, unknown> } | Record<string, unknown>>(
    '/api/wallet/withdrawal/initialize',
    { method: 'POST', body: JSON.stringify({ ...rest, amount: amount * 100 }) }, // convert naira → kobo
  )
  return ('data' in res && res.data ? res.data : res) as Record<string, unknown>
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

export interface TrustScore {
  trustScore: number
  displayScore?: number
  [key: string]: unknown
}

export async function getTrustScore(): Promise<TrustScore> {
  const res = await authRequest<{ data?: TrustScore } | TrustScore>('/api/trust/my-score', { method: 'GET' })
  return ('data' in res && res.data ? res.data : res) as TrustScore
}

// ── Loans ─────────────────────────────────────────────────────────────────────

export interface LoanEligibility {
  eligible: boolean
  reason?: string
  maxLoanAmount?: number
  expectedPayout?: number
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

export async function applyForLoan(payload: { circleId: string }): Promise<Loan> {
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

// ── Circle Invites ─────────────────────────────────────────────────────────────

export interface CircleInvite {
  id: string
  email?: string
  phone?: string
  name?: string
  status: string
  createdAt: string
  expiresAt?: string
  [key: string]: unknown
}

export async function sendCircleInvite(
  circleId: string,
  payload: { email: string },
): Promise<{ message: string; data?: CircleInvite }> {
  return authRequest(`/api/admin/rosca/${circleId}/invites`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getCircleInvites(circleId: string): Promise<CircleInvite[]> {
  const res = await authRequest<{ data?: CircleInvite[] } | CircleInvite[]>(
    `/api/admin/rosca/${circleId}/invites`,
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: CircleInvite[] }).data ?? []
}

export function revokeCircleInvite(circleId: string, inviteId: string): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/invites/${inviteId}`, { method: 'DELETE' })
}

// ── Member Progress ────────────────────────────────────────────────────────────

export interface MemberProgress {
  userId: string
  name: string
  roundsPaid?: number
  totalRounds?: number
  amountContributed?: number
  expectedAmount?: number
  missedPayments?: number
  status?: string
  payoutDate?: string
  [key: string]: unknown
}

export async function getMemberProgress(circleId: string): Promise<MemberProgress[]> {
  const res = await authRequest<{ data?: MemberProgress[] } | MemberProgress[]>(
    `/api/admin/rosca/${circleId}/members/progress`,
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: MemberProgress[] }).data ?? []
}

// ── Notify Missing Contributors ────────────────────────────────────────────────

export async function notifyMissingContributors(
  circleId: string,
  payload: { roundNumber?: number; memberIds?: string[]; message?: string },
): Promise<{ message: string; notified?: number }> {
  return authRequest(`/api/admin/rosca/${circleId}/notify-missing`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── Financial Health ───────────────────────────────────────────────────────────

export interface CycleHealth {
  cycle: number
  expectedContributions: number
  actualContributions: number
  collectionRate: number
  disbursed: number
  pendingDisbursements: number
  [key: string]: unknown
}

export interface FinancialHealth {
  totalExpected?: number
  totalCollected?: number
  collectionRate?: number
  totalDisbursed?: number
  cycles?: CycleHealth[]
  [key: string]: unknown
}

export async function getFinancialHealth(circleId: string): Promise<FinancialHealth> {
  const res = await authRequest<{ data?: FinancialHealth } | FinancialHealth>(
    `/api/admin/rosca/${circleId}/financial-health`,
    { method: 'GET' },
  )
  return ('data' in (res as object) && (res as Record<string, unknown>).data
    ? (res as Record<string, unknown>).data
    : res) as FinancialHealth
}
