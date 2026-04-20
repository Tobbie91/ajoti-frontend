const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// ── Core request ─────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const { headers, ...rest } = options
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (data as { message?: string | string[] }).message
    throw new Error(Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong'))
  }
  return data as T
}

// ── Token refresh ─────────────────────────────────────────────────────────────

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

async function tryRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem('superadmin_refresh_token')
  if (!refreshToken) throw new Error('No refresh token')

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!res.ok) throw new Error('Refresh failed')

  const data = (await res.json()) as { accessToken: string; refreshToken: string }
  localStorage.setItem('superadmin_access_token', data.accessToken)
  localStorage.setItem('superadmin_refresh_token', data.refreshToken)
  return data.accessToken
}

export function clearSessionAndRedirect() {
  ;[
    'superadmin_access_token',
    'superadmin_refresh_token',
    'superadmin_user',
  ].forEach((k) => localStorage.removeItem(k))
  window.location.href = '/login'
}

// ── Auth headers + authenticated requests ────────────────────────────────────

function authHeaders(token?: string): Record<string, string> {
  const t = token ?? localStorage.getItem('superadmin_access_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function authRequest<T>(path: string, options: RequestInit): Promise<T> {
  const { headers, ...rest } = options

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(headers as Record<string, string>) },
  })

  if (res.status !== 401) {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = (data as { message?: string | string[] }).message
      throw new Error(Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong'))
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
        headers: { ...authHeaders(newToken), ...(headers as Record<string, string>) },
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
          headers: { ...authHeaders(newToken), ...(headers as Record<string, string>) },
        }),
      )
    })
    setTimeout(() => reject(new Error('Session expired')), 10_000)
  })
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface SuperadminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)) as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; refreshToken: string; user: SuperadminUser }> {
  const res = await fetch(`${BASE_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', email, password }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = (data as { message?: string | string[] }).message
    throw new Error(Array.isArray(msg) ? msg[0] : (msg ?? 'Invalid email or password'))
  }

  const raw = data as Record<string, unknown>
  const payload = (raw.data ?? raw) as Record<string, unknown>

  const token = (payload.accessToken ?? payload.token ?? '') as string
  const refreshToken = (payload.refreshToken ?? '') as string

  // Role and sub are in the JWT payload — backend doesn't return a user object
  const jwtPayload = decodeJwtPayload(token)

  const user: SuperadminUser = {
    id: (jwtPayload.sub ?? '') as string,
    email,
    firstName: (jwtPayload.firstName ?? '') as string,
    lastName: (jwtPayload.lastName ?? '') as string,
    role: (jwtPayload.role ?? '') as string,
  }

  return { token, refreshToken, user }
}

export function logoutApi(refreshToken: string): Promise<{ message: string }> {
  return authRequest('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  users: { total: number; active: number; suspended: number; banned: number; newThisWeek: number }
  circles: { total: number; active: number; completed: number; cancelled: number; newThisWeek: number }
  kyc: { pending: number; approved: number; rejected: number }
  wallet: {
    totalUserBalanceKobo: string
    totalUserBalanceNaira: string
    platformPoolKobo: string
    platformPoolNaira: string
    totalWallets: number
  }
  defaulters: { outstandingDebts: number }
}

export function getDashboardStats(): Promise<DashboardStats> {
  return authRequest('/api/superadmin/analytics/dashboard', { method: 'GET' })
}

export interface WalletSummary {
  totalUserBalanceKobo: string
  totalUserBalanceNaira: string
  platformPoolKobo: string
  platformPoolNaira: string
  walletCounts: { active: number; frozen: number; suspended: number }
}

export function getWalletSummary(): Promise<WalletSummary> {
  return authRequest('/api/superadmin/analytics/wallet', { method: 'GET' })
}

export interface TransactionAnalytics {
  period: { start: string; end: string }
  inflow: { totalKobo: string; totalNaira: string; count: number; byDay: { date: string; amountKobo: string }[] }
  outflow: { totalKobo: string; totalNaira: string; count: number; byDay: { date: string; amountKobo: string }[] }
  platformFees: { totalKobo: string; totalNaira: string; count: number; byDay: { date: string; amountKobo: string }[] }
}

export function getTransactionAnalytics(params: {
  period?: '7d' | '30d' | '90d' | 'custom'
  startDate?: string
  endDate?: string
}): Promise<TransactionAnalytics> {
  const q = new URLSearchParams(params as Record<string, string>).toString()
  return authRequest(`/api/superadmin/analytics/transactions?${q}`, { method: 'GET' })
}

export interface GrowthMetrics {
  period: string
  users: { current: number; previous: number; delta: number; percentChange: string | null }
  circles: { current: number; previous: number; delta: number; percentChange: string | null }
  timeSeries: {
    users: { date: string; count: number }[]
    circles: { date: string; count: number }[]
  }
}

export function getGrowthMetrics(params: {
  period?: '7d' | '30d' | '90d'
}): Promise<GrowthMetrics> {
  const q = new URLSearchParams(params as Record<string, string>).toString()
  return authRequest(`/api/superadmin/analytics/growth?${q}`, { method: 'GET' })
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface SuperadminUserRow {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  status: string
  isVerified: boolean
  createdAt: string
  suspendedAt: string | null
  suspensionReason: string | null
  adminRequestedAt: string | null
  kyc: { status: string; step: string } | null
  wallet: { id: string; status: string } | null
  _count: { roscaMemberships: number }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export function listUsers(params: {
  page?: number
  limit?: number
  search?: string
  status?: string
  role?: string
  kycStatus?: string
  registeredFrom?: string
  registeredTo?: string
  pendingAdminRequest?: boolean
}): Promise<PaginatedResponse<SuperadminUserRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>,
  ).toString()
  return authRequest(`/api/superadmin/users?${q}`, { method: 'GET' })
}

export interface SuperadminUserDetail {
  user: Record<string, unknown>
  wallet: { id: string; status: string; balanceKobo: string; balanceNaira: string } | null
  roscaParticipation: unknown[]
  recentActivity: unknown[]
  outstandingDebts: unknown[]
}

export function getUserDetail(userId: string): Promise<SuperadminUserDetail> {
  return authRequest(`/api/superadmin/users/${userId}`, { method: 'GET' })
}

export function updateUserStatus(
  userId: string,
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED',
  reason?: string,
): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  })
}

export function promoteToSuperadmin(userId: string): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/users/${userId}/promote`, { method: 'PATCH' })
}

export function approveAdminRequest(userId: string): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/users/${userId}/approve-admin`, { method: 'PATCH' })
}

export function rejectAdminRequest(userId: string): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/users/${userId}/reject-admin`, { method: 'PATCH' })
}

// ── KYC ───────────────────────────────────────────────────────────────────────

export interface KycQueueRow {
  id: string
  userId: string
  status: string
  step: string
  kycLevel: number
  submittedAt: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  rejectionReason: string | null
  ninVerifiedAt: string | null
  bvnVerifiedAt: string | null
  nextOfKinName: string | null
  nextOfKinRelationship: string | null
  nextOfKinPhone: string | null
  address: string | null
  city: string | null
  state: string | null
  lga: string | null
  country: string | null
  selfieUrl: string | null
  governmentIdType: string | null
  governmentIdFrontUrl: string | null
  governmentIdBackUrl: string | null
  proofOfAddressType: string | null
  proofOfAddressUrl: string | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    gender: string | null
    dob: string | null
    isVerified: boolean
    status: string
    createdAt: string
  }
}

export function listKycQueue(params: {
  page?: number
  limit?: number
  status?: string
}): Promise<PaginatedResponse<KycQueueRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as Record<string, string>,
  ).toString()
  return authRequest(`/api/superadmin/kyc?${q}`, { method: 'GET' })
}

export function getKycDetail(userId: string): Promise<Record<string, unknown>> {
  return authRequest(`/api/superadmin/kyc/${userId}`, { method: 'GET' })
}

export function approveKyc(userId: string): Promise<unknown> {
  return authRequest(`/api/kyc/approve/${userId}`, { method: 'PATCH' })
}

export function rejectKyc(userId: string, rejectionReason: string): Promise<unknown> {
  return authRequest(`/api/kyc/reject/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ rejectionReason }),
  })
}

// ── Ledger & Audit ────────────────────────────────────────────────────────────

export interface LedgerRow {
  id: string
  entryType: string
  movementType: string
  sourceType: string
  amount: string
  balanceAfter: string
  reference: string
  metadata: unknown
  createdAt: string
  wallet?: { user?: { firstName: string; lastName: string; email: string } }
}

export function getLedger(params: {
  page?: number
  limit?: number
  userId?: string
  reference?: string
  sourceType?: string
  from?: string
  to?: string
}): Promise<PaginatedResponse<LedgerRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>,
  ).toString()
  return authRequest(`/api/superadmin/ledger?${q}`, { method: 'GET' })
}

export interface AuditLogRow {
  id: string
  actorId: string
  actorType: string
  action: string
  entityType: string
  entityId: string
  reason: string | null
  metadata: unknown
  createdAt: string
}

export function getAuditLogs(params: {
  page?: number
  limit?: number
  actorId?: string
  entityType?: string
  action?: string
  from?: string
  to?: string
}): Promise<PaginatedResponse<AuditLogRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>,
  ).toString()
  return authRequest(`/api/superadmin/audit-logs?${q}`, { method: 'GET' })
}

export function exportCsv(params: {
  type: 'transactions' | 'users' | 'ledger' | 'circles'
  startDate: string
  endDate: string
}): Promise<Blob> {
  const token = localStorage.getItem('superadmin_access_token')
  const q = new URLSearchParams(params as Record<string, string>).toString()
  return fetch(`${BASE_URL}/api/superadmin/export?${q}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((r) => r.blob())
}

// ── Circles ───────────────────────────────────────────────────────────────────

export interface CircleRow {
  id: string
  name: string
  status: string
  contributionAmount: string
  frequency: string
  durationCycles: number
  currentCycle: number
  memberCount: number
  admin?: { firstName: string; lastName: string; email: string }
}

export function getAllRoscaCircles(params: {
  status?: string
  adminId?: string
} = {}): Promise<{ success: boolean; data: CircleRow[] }> {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>,
  ).toString()
  return authRequest(`/api/superadmin/rosca/all${q ? `?${q}` : ''}`, { method: 'GET' })
}

export function listCircles(params: {
  page?: number
  limit?: number
  status?: string
  search?: string
}): Promise<PaginatedResponse<CircleRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>,
  ).toString()
  return authRequest(`/api/superadmin/circles?${q}`, { method: 'GET' })
}

export function getDefaulters(page = 1, limit = 20): Promise<PaginatedResponse<unknown>> {
  return authRequest(`/api/superadmin/circles/defaulters?page=${page}&limit=${limit}`, { method: 'GET' })
}

export function getCircleDetail(circleId: string): Promise<Record<string, unknown>> {
  return authRequest(`/api/superadmin/circles/${circleId}`, { method: 'GET' })
}

export function cancelCircle(
  circleId: string,
  reason: string,
): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/circles/${circleId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

export function flagMember(
  membershipId: string,
  reason: string,
): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/circles/members/${membershipId}/flag`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

export interface ReconcileResult {
  reference: string
  outcome: string
  reconciledAt: string
  transactionId?: string
  transactionStatus?: string
  amountKobo?: string
  reason?: string
  providerMessage?: string
}

export function reconcileFunding(reference: string): Promise<{ success: boolean; message: string; data: ReconcileResult }> {
  return authRequest(`/api/admin/funding/reconcile/${encodeURIComponent(reference)}`, { method: 'POST' })
}
