import { ApiError, createApiClient, parseJsonSafely } from '@ajoti/shared'

export { ApiError }

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const client = createApiClient({
  baseUrl: BASE_URL,
  storagePrefix: '',
  sessionExpiredRedirect: '/login',
  extraSessionKeys: ['kyc_completed', 'verify_email', 'reset_email', 'pending_redirect'],
})

const { request, authRequest } = client

// ── Auth ────────────────────────────────────────────────────────────────────

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
    body: JSON.stringify({ ...payload, role: 'CIRCLE_ADMIN' }),
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

  const data = await parseJsonSafely(res)

  if (!res.ok) {
    const msg = (data as { message?: string | string[] }).message
    throw new ApiError(Array.isArray(msg) ? msg[0] : msg ?? 'Invalid email or password', res.status)
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

// ── KYC ─────────────────────────────────────────────────────────────────────

export interface KycStatus {
  ninVerified: boolean
  bvnVerified: boolean
  nokSubmitted: boolean
  status: string // "PENDING" | "APPROVED" | "REJECTED"
  step?: string
  kycLevel: number // 0 = none, 1 = NIN+BVN+NOK, 2 = +GovID, 3 = +ProofOfAddress
  rejectionReason?: string | null
  verificationData?: Record<string, unknown> | null
  address?: string
  city?: string
  state?: string
  lga?: string
}

export function getKycStatus(): Promise<KycStatus> {
  return authRequest('/api/kyc/status', { method: 'GET' })
}

export function resubmitKyc(): Promise<KycStatus> {
  return authRequest('/api/kyc/resubmit', { method: 'POST' })
}

export interface ProveInitiatePayload {
  nin?: string
  bvn?: string
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
}

export function proveInitiate(payload: ProveInitiatePayload): Promise<{ monoUrl: string | null; reference: string }> {
  return authRequest('/api/kyc/prove/initiate', {
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
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'FROZEN'
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

export function verifyPendingEmailChange(otp: string): Promise<{ message: string; data?: UserProfile }> {
  return authRequest('/api/users/me/email/verify', {
    method: 'POST',
    body: JSON.stringify({ otp }),
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

export function deleteMyAccount(currentPassword: string, reason?: string): Promise<{ message: string }> {
  return authRequest('/api/users/me', {
    method: 'DELETE',
    body: JSON.stringify({ currentPassword, confirm: 'DELETE', reason }),
  })
}

export function freezeMyAccount(currentPassword: string, reason?: string): Promise<{ message: string; ticketId: string }> {
  return authRequest('/api/users/me/freeze', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, reason }),
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
  currentCycle?: number
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
  members?: CircleMember[]
  [key: string]: unknown
}

// GET /api/rosca — list circles the admin belongs to
export function listRoscaCircles(): Promise<RoscaCircle[]> {
  return authRequest<{ data?: RoscaCircle[] } | RoscaCircle[]>('/api/rosca', { method: 'GET' })
    .then((res) => Array.isArray(res) ? res : res.data ?? [])
}

export interface CircleRules {
  collateralRatioPercent: number
  latePenaltyRatioPercent: number
  minTrustScore: number
  postStartExitPenaltyPercent: number
}

// GET /api/rosca/circle-rules — current platform-wide circle rules (member-facing).
// Always fetch this live for disclosure copy — never hardcode the rate, so the UI
// can't drift from whatever the superadmin has actually configured.
export function getCircleRules(): Promise<{ success: boolean; data: CircleRules }> {
  return authRequest('/api/rosca/circle-rules', { method: 'GET' })
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
    currentCycle?: number
    filledSlots?: number
    maxSlots?: number
    frequency?: string
    contributionAmount?: number | string
    nextPayoutDate?: string
    admin?: { firstName?: string; lastName?: string }
  }
  [key: string]: unknown
}

// GET /api/rosca/my-join-requests — generic authenticated-user endpoint; admins
// are members too, so this reads the admin's own join requests (not the circles
// they administer — that's listAllRoscaCircles).
export async function getMyJoinRequests(): Promise<MyJoinRequest[]> {
  const res = await authRequest<{ data?: MyJoinRequest[] } | MyJoinRequest[]>(
    '/api/rosca/my-join-requests',
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: MyJoinRequest[] }).data ?? []
}

// GET /api/rosca/my-participations — circles the admin (as a member) is actively
// participating in.
export async function getMyParticipations(): Promise<RoscaCircle[]> {
  const res = await authRequest<{ data?: RoscaCircle[] } | RoscaCircle[]>(
    '/api/rosca/my-participations',
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: RoscaCircle[] }).data ?? []
}

// The circles the admin is actually a MEMBER of (participations + approved join
// requests), merged and deduped by circleId — distinct from listAllRoscaCircles,
// which is circles the admin ADMINISTERS. Anywhere that needs "my memberships"
// (e.g. the loan application's group selector) should use this.
export async function getMyActiveCircles(): Promise<RoscaCircle[]> {
  const [participations, joinRequests] = await Promise.all([
    getMyParticipations().catch(() => []),
    getMyJoinRequests().catch(() => []),
  ])

  const approvedRequests = joinRequests.filter((r) =>
    ['ACTIVE', 'STARTED'].includes((r.status ?? '').toUpperCase()),
  )

  const seenIds = new Set<string>()
  const merged: RoscaCircle[] = []
  for (const c of participations) {
    if (!seenIds.has(c.id)) {
      seenIds.add(c.id)
      merged.push(c)
    }
  }
  for (const r of approvedRequests) {
    const c = r.circle
    if (c?.id && !seenIds.has(c.id)) {
      seenIds.add(c.id)
      merged.push({
        id: c.id,
        name: c.name ?? `Circle ${c.id.slice(0, 6)}`,
        description: '',
        contributionAmount: Number(c.contributionAmount ?? 0),
        frequency: c.frequency ?? '',
        durationCycles: c.durationCycles ?? 0,
        maxSlots: c.maxSlots ?? 0,
        totalSlots: c.maxSlots ?? 0,
        filledSlots: c.filledSlots ?? 0,
        status: r.status,
        visibility: '',
        collateralPercentage: 0,
        payoutLogic: '',
        autoStartOnFull: false,
        latePenaltyPercent: 0,
        admin: { firstName: c.admin?.firstName ?? '', lastName: c.admin?.lastName ?? '' },
      })
    }
  }
  return merged
}

// ── Debts ─────────────────────────────────────────────────────────────────────

export type DebtCategory = 'MISSED_CONTRIBUTION' | 'LATE_PENALTY' | 'MIXED'

export interface Debt {
  id: string
  circleId: string
  circleName?: string
  cycleNumber: number
  status: string
  category: DebtCategory
  categoryLabel: string
  outstandingTotal: string
  outstandingBreakdown: {
    contribution: string
    interest: string
    bridge: string
    collateral: string
    penalty: string
  }
  blocksLoanEligibility: boolean
  createdAt: string
  settledAt: string | null
}

export async function getMyDebts(): Promise<Debt[]> {
  const res = await authRequest<{ success: boolean; data: Debt[] }>('/api/debts/mine', { method: 'GET' })
  return res.data
}

export async function repayDebt(debtId: string, amountKobo?: number): Promise<Debt> {
  const res = await authRequest<{ success: boolean; message: string; data: Debt }>(
    `/api/debts/${debtId}/repay`,
    { method: 'POST', body: JSON.stringify(amountKobo !== undefined ? { amountKobo } : {}) },
  )
  return res.data
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
  visibility: string
}

export function createRoscaCircle(payload: CreateRoscaPayload): Promise<RoscaCircle> {
  return authRequest('/api/admin/rosca', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// PATCH /api/admin/rosca/{circleId} — update a DRAFT circle's configuration.
// payoutLogic is deliberately NOT here — use updatePayoutConfig instead, the
// dedicated endpoint (backend rejects payoutLogic on this DTO entirely).
export interface UpdateRoscaPayload {
  name?: string
  description?: string
  contributionAmount?: string
  maxSlots?: number
  frequency?: 'MONTHLY' | 'WEEKLY' | 'BI_WEEKLY'
  visibility?: string
  initialContributionDeadline?: string
}

export function updateRoscaCircle(circleId: string, payload: UpdateRoscaPayload): Promise<RoscaCircle> {
  return authRequest(`/api/admin/rosca/${circleId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// PATCH /api/admin/rosca/{circleId}/activate — activate a circle
export function activateRoscaCircle(circleId: string, startDate: string): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/activate`, {
    method: 'PATCH',
    body: JSON.stringify({ initialContributionDeadline: startDate }),
  })
}

// PATCH /api/admin/rosca/{circleId}/close — close (cancel) a circle
export function closeRoscaCircle(circleId: string): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/close`, { method: 'PATCH' })
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
  id?: string
  cycleNumber?: number
  contributionDeadline?: string
  payoutDate?: string
  recipientId?: string | null
  month?: string
  recipient?: string
  status: string
  [key: string]: unknown
}

export function getRoscaSchedules(circleId: string): Promise<RoscaSchedule[]> {
  return authRequest<{ data?: RoscaSchedule[] } | RoscaSchedule[]>(
    `/api/rosca/${circleId}/schedules`,
    { method: 'GET' },
  ).then((res) => Array.isArray(res) ? res : res.data ?? [])
}

// ── Payouts ──────────────────────────────────────────────────────────────────

export interface Payout {
  id: string
  cycleNumber?: number
  recipientId?: string
  recipient?: { firstName: string; lastName: string; email?: string }
  amount: string
  status: string
  createdAt?: string
  processedAt?: string
  schedule?: { cycleNumber: number; payoutDate: string }
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
  contributionId: string
  userId: string
  memberName: string
  cycleNumber: number
  amount: string
  penaltyAmount: string
  isLate: boolean
  paidAt: string | null
  [key: string]: unknown
}

export async function getAllCircleContributions(circleId: string): Promise<Contribution[]> {
  const res = await authRequest<{ data?: Contribution[] }>(
    `/api/admin/rosca/${circleId}/contributions-all`,
    { method: 'GET' },
  )
  return (res as { data?: Contribution[] }).data ?? []
}

// GET /api/admin/rosca/{circleId}/disbursements — admin view of disbursements
export interface Disbursement {
  cycleNumber: number
  recipientId: string
  recipientName: string
  payoutDate: string
  contributionDeadline: string
  scheduleStatus: string
  payoutStatus: string | null
  amountPaidOut: string | null
  processedAt: string | null
  [key: string]: unknown
}

export async function getAdminDisbursements(circleId: string): Promise<Disbursement[]> {
  const res = await authRequest<{ data?: { schedules?: Disbursement[] } }>(
    `/api/admin/rosca/${circleId}/disbursements`,
    { method: 'GET' },
  )
  return (res as { data?: { schedules?: Disbursement[] } }).data?.schedules ?? []
}

export function extendCycleDeadline(
  circleId: string,
  cycleNumber: number,
  newPayoutDate: string,
): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/schedules/${cycleNumber}/extend`, {
    method: 'PATCH',
    body: JSON.stringify({ newPayoutDate }),
  })
}

// GET /api/admin/rosca/{circleId}/contributions — admin view of contributions
export interface AdminContribution {
  contributionId: string
  userId: string
  memberName: string
  amount: string
  penaltyAmount: string
  isLate: boolean
  paidAt: string
}

export interface AdminContributionsResponse {
  cycleNumber: number
  contributions: AdminContribution[]
  totalCollected: string
  totalPenalties: string
}

export async function getAdminCircleContributions(
  circleId: string,
  cycleNumber?: number,
): Promise<AdminContributionsResponse> {
  const url = cycleNumber != null
    ? `/api/admin/rosca/${circleId}/contributions?round=${cycleNumber}`
    : `/api/admin/rosca/${circleId}/contributions`
  const res = await authRequest<{ data?: AdminContributionsResponse }>(url, { method: 'GET' })
  return (res as { data?: AdminContributionsResponse }).data ?? {
    cycleNumber: cycleNumber ?? 1,
    contributions: [],
    totalCollected: '0',
    totalPenalties: '0',
  }
}

export async function makeContribution(circleId: string, cycleNumber: number): Promise<CircleContribution> {
  const res = await authRequest<{ data?: CircleContribution } | CircleContribution>(`/api/rosca/${circleId}/contributions`, {
    method: 'POST',
    body: JSON.stringify({ cycleNumber }),
  })
  return ('data' in res && res.data ? res.data : res) as CircleContribution
}

// ── Wallet Transactions ───────────────────────────────────────────────────────

export interface WalletTransaction {
  id: string
  entryType: string
  movementType: string
  bucketType: string | null
  amount: string | number
  balanceBefore?: string | number
  balanceAfter?: string | number
  createdAt: string
  metadata?: Record<string, unknown>
  sourceType?: string
  type?: string
  description?: string
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

// ── Virtual Account ───────────────────────────────────────────────────────────

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

// ── Saved Bank Accounts ───────────────────────────────────────────────────────

export interface BankOption {
  id: number
  code: string
  name: string
}

export async function getBanks(): Promise<BankOption[]> {
  const res = await authRequest<{ data: BankOption[] }>('/api/wallet/withdrawal/banks', { method: 'GET' })
  return res.data ?? []
}

export async function resolveAccount(accountNumber: string, bankCode: string): Promise<{ accountNumber: string; accountName: string }> {
  const res = await authRequest<{ data: { accountNumber: string; accountName: string } }>(
    '/api/wallet/withdrawal/resolve-account',
    { method: 'POST', body: JSON.stringify({ accountNumber, bankCode }) },
  )
  return res.data
}

export interface SavedBankAccount {
  id: string
  bankCode: string
  bankName: string
  accountNumber: string
  accountName: string
  isDefault: boolean
  createdAt: string
}

export function listBankAccounts(): Promise<{ data: SavedBankAccount[] }> {
  return authRequest('/api/users/me/bank-accounts', { method: 'GET' })
}

export function addBankAccount(bankCode: string, bankName: string, accountNumber: string, transactionPin: string): Promise<{ data: SavedBankAccount }> {
  return authRequest('/api/users/me/bank-accounts', {
    method: 'POST',
    body: JSON.stringify({ bankCode, bankName, accountNumber, transactionPin }),
  })
}

export function removeBankAccount(id: string): Promise<{ data: { deleted: boolean } }> {
  return authRequest(`/api/users/me/bank-accounts/${id}`, { method: 'DELETE' })
}

export function setDefaultBankAccount(id: string): Promise<{ data: { updated: boolean } }> {
  return authRequest(`/api/users/me/bank-accounts/${id}/set-default`, { method: 'PATCH' })
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
  trustScore: number
  displayScore?: number
  atiBreakdown?: ATIBreakdown | null
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
  ineligibilityReason?: string
  finalCreditScore?: number
  allowedPercent?: number
  expectedPayoutAmount?: string
  grossLoanAmount?: string
  companyFee?: string
  maxLoanAmount?: string
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
  payoutAmount: number | string
  loanAmount: number | string
  companyFee: number | string
  finalPayout: number | string
  status: string
  createdAt: string
  repaidAt?: string | null
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
  const res = await authRequest<{ data?: unknown[] } | unknown[]>('/api/notifications', { method: 'GET' })
  const raw: unknown[] = Array.isArray(res) ? res : ((res as { data?: unknown[] }).data ?? [])
  return raw.map((n: unknown) => {
    const r = n as Record<string, unknown>
    return {
      ...r,
      message: (r.message ?? r.body ?? '') as string,
      read: (r.read ?? r.isRead ?? false) as boolean,
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

export interface PeerReview {
  id: string
  circleId?: string
  reviewerId: string
  reviewerName?: string
  revieweeId: string
  revieweeName?: string
  rating: number
  comment?: string | null
  createdAt: string
  reviewee?: { firstName?: string; lastName?: string; [key: string]: unknown }
  reviewer?: { firstName?: string; lastName?: string; [key: string]: unknown }
  [key: string]: unknown
}

// GET /api/rosca/:circleId/reviews — CIRCLE_ADMIN (own circle) or STAFF only
export async function getCircleReviews(circleId: string): Promise<PeerReview[]> {
  const res = await authRequest<{ data?: PeerReview[] } | PeerReview[]>(
    `/api/rosca/${circleId}/reviews`,
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: PeerReview[] }).data ?? []
}

// POST /api/rosca/:circleId/reviews — circle must be COMPLETED, one review per reviewer/reviewee/circle
export async function submitPeerReview(
  circleId: string,
  payload: { revieweeId: string; rating: number; comment?: string },
): Promise<PeerReview> {
  const res = await authRequest<{ data?: PeerReview } | PeerReview>(
    `/api/rosca/${circleId}/reviews`,
    { method: 'POST', body: JSON.stringify(payload) },
  )
  return ('data' in res && res.data ? res.data : res) as PeerReview
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
  missedPayments?: number
  status?: string
  payoutPosition?: number
  [key: string]: unknown
}

interface MemberProgressApiItem {
  userId: string
  name: string
  completedCycles: number
  durationCycles: number
  payoutStatus: string
  payoutPosition: number
  totalLatePayments: number
}

export async function getMemberProgress(circleId: string): Promise<MemberProgress[]> {
  const res = await authRequest<{ data?: { members?: MemberProgressApiItem[] } }>(
    `/api/admin/rosca/${circleId}/members/progress`,
    { method: 'GET' },
  )
  const members = (res as { data?: { members?: MemberProgressApiItem[] } }).data?.members ?? []
  return members.map((m) => ({
    userId: m.userId,
    name: m.name,
    roundsPaid: m.completedCycles,
    totalRounds: m.durationCycles,
    missedPayments: m.totalLatePayments,
    status: m.payoutStatus,
    payoutPosition: m.payoutPosition,
  }))
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
  cycleNumber: number
  contributionDeadline?: string
  scheduleStatus: string
  expectedPot: string
  collected: string
  outstanding: string
  expectedCount: number
  collectedCount: number
  [key: string]: unknown
}

export interface FinancialHealth {
  circleId?: string
  contributionAmount?: string
  filledSlots?: number
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

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  circleId: string
  senderId: string
  senderName: string
  senderInitials: string
  body: string
  createdAt: string
}

export interface ChatCircle {
  id: string
  name: string
  lastMessage: ChatMessage | null
}

export function getChatBaseUrl(): string {
  return client.getBaseUrl()
}

export function getAccessToken(): string | null {
  return client.getAccessToken()
}

export async function getChatCircles(): Promise<ChatCircle[]> {
  return authRequest('/api/chat/circles', { method: 'GET' })
}

export async function getChatMessages(circleId: string, before?: string): Promise<ChatMessage[]> {
  const qs = before ? `?before=${encodeURIComponent(before)}` : ''
  return authRequest(`/api/chat/circles/${circleId}/messages${qs}`, { method: 'GET' })
}

// ── Support Tickets ───────────────────────────────────────────────────────────

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketCategory = 'ACCOUNT' | 'WALLET' | 'TRANSACTION' | 'KYC' | 'ROSCA' | 'LOAN' | 'OTHER'
export type TicketSenderRole = 'USER' | 'ADMIN' | 'SUPERADMIN'

export interface SupportMessage {
  id: string
  body: string
  senderRole: TicketSenderRole
  sender: { id: string; firstName: string; lastName: string; role: string }
  createdAt: string
}

export interface SupportTicketRow {
  id: string
  category: TicketCategory
  subject: string
  status: TicketStatus
  refType: string | null
  refId: string | null
  createdAt: string
  updatedAt: string
  messages: Pick<SupportMessage, 'body' | 'createdAt' | 'senderRole'>[]
  _count: { messages: number }
}

export interface SupportTicketDetail extends SupportTicketRow {
  messages: SupportMessage[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export function listMyTickets(params: {
  page?: number
  limit?: number
  status?: TicketStatus | ''
  category?: TicketCategory | ''
} = {}): Promise<PaginatedResponse<SupportTicketRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>,
  ).toString()
  return authRequest(`/api/support/tickets?${q}`, { method: 'GET' })
}

export function getMyTicket(ticketId: string): Promise<SupportTicketDetail> {
  return authRequest(`/api/support/tickets/${ticketId}`, { method: 'GET' })
}

export function createTicket(payload: {
  category: TicketCategory
  subject: string
  body: string
  refType?: string
  refId?: string
}): Promise<SupportTicketDetail> {
  return authRequest('/api/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function replyToTicket(ticketId: string, body: string): Promise<SupportMessage> {
  return authRequest(`/api/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}

export function closeMyTicket(ticketId: string): Promise<{ id: string; status: TicketStatus }> {
  return authRequest(`/api/support/tickets/${ticketId}/close`, { method: 'PATCH' })
}

// Customer capabilities retained from the retired member application.
export interface ProveInitiateResult {
  monoUrl: string | null   // null = test bypass (auto-verified, skip widget)
  reference: string
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

export function leaveRoscaCircle(circleId: string): Promise<{ success: boolean; message: string }> {
  return authRequest(`/api/rosca/${circleId}/leave`, { method: 'DELETE' })
}

export function joinRoscaCircle(circleId: string): Promise<{ message: string }> {
  return authRequest(`/api/rosca/${circleId}/join`, { method: 'POST' })
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
  return Array.isArray(res) ? res : res.data ?? []
}

// ── Wallet ──────────────────────────────────────────────────────────────────

export interface PendingWithdrawal {
  reference: string
  amountKobo: string
  initiatedAt: string
}

export interface Wallet {
  id: string
  currency: string
  status: string
  balance: WalletBalance
  // Stage 11: while a withdrawal is PENDING, every other debit/reserve on the
  // wallet is blocked (contributions, circle joins, savings, another
  // withdrawal). Null when nothing is pending.
  pendingWithdrawal: PendingWithdrawal | null
  [key: string]: unknown
}

export async function getWallet(): Promise<Wallet> {
  const res = await authRequest<{ data?: Wallet } | Wallet>('/api/wallet', { method: 'GET' })
  return ('data' in res && res.data ? res.data : res) as Wallet
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

// ── Wallet Funding ────────────────────────────────────────────────────────────

export interface FundingMethod {
  id: string
  name: string
  icon: string
  fee: number
  minAmount: number
  description: string
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

export interface WithdrawalResponse {
  reference?: string
  status?: string
  message?: string
  [key: string]: unknown
}

export interface LoanApplication {
  circleId: string
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export function handleFlutterwaveWebhook(payload: Record<string, unknown>): Promise<{ message: string }> {
  return request('/api/webhooks/flutterwave', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
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

export interface InvitePreview {
  token: string
  email: string
  expiresAt: string
  usedAt: string | null
  circle: {
    name: string
    contributionAmount: string
    frequency: string
    durationCycles: number
    maxSlots: number
    filledSlots: number
    adminName: string
  }
}

export async function getInvitePreview(token: string): Promise<InvitePreview> {
  const res = await authRequest<{ data: InvitePreview }>(`/api/rosca/invite-preview/${token}`, { method: 'GET' })
  return (res as { data: InvitePreview }).data
}

export async function joinByInvite(token: string): Promise<{ message: string }> {
  return authRequest('/api/rosca/join-by-invite', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function messageAdmin(circleId: string, message: string): Promise<{ message: string }> {
  return authRequest(`/api/rosca/${circleId}/message-admin`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
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
  const circle = await getRoscaCircle(circleId)
  return circle.members ?? []
}

export async function getCirclePeerReviews(circleId: string): Promise<PeerReview[]> {
  const res = await authRequest<{ data?: PeerReview[] } | PeerReview[]>(
    `/api/rosca/${circleId}/reviews/mine`,
    { method: 'GET' },
  )
  return Array.isArray(res) ? res : (res as { data?: PeerReview[] }).data ?? []
}

// ── Admin Access Request ──────────────────────────────────────────────────────

export function requestAdminAccess(): Promise<{ message: string }> {
  return authRequest('/api/users/me/request-admin', { method: 'POST' })
}
