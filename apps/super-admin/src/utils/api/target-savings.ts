import { authRequest } from './client'

export type TargetSavingsStatus = 'ACTIVE' | 'MATURED' | 'CANCELLED'
export type TargetSavingsType = 'INDIVIDUAL' | 'GROUP'
export type TargetSavingsInvestmentStatus = 'LEGACY' | 'DISABLED_PENDING_INTEGRATION'

export interface TargetSavingsOversightRow {
  id: string
  name: string
  description?: string | null
  type: TargetSavingsType
  status: TargetSavingsStatus
  currency: string
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  isPublic: boolean
  startDate: string
  maturityDate: string
  createdAt: string
  owner: { id: string; firstName: string; lastName: string; email: string }
  memberCount: number
  completedMemberCount: number
  perMemberTargetAmountKobo: string
  contributionAmountKobo: string
  totalSavedKobo: string
  effectiveTargetAmountKobo: string
  investment: {
    enabled: boolean
    provider: string | null
    productCode: string | null
    productType: string | null
    approvalVersion: string | null
    lifecycleStatus: TargetSavingsInvestmentStatus
  }
}

export interface TargetSavingsOversightResponse {
  success: true
  data: TargetSavingsOversightRow[]
  meta: { page: number; limit: number; total: number; totalPages: number }
  summary: { activePlans: number; maturedPlans: number; groupPlans: number; totalSavedKobo: string }
}

export async function getTargetSavingsOversight(params: {
  page?: number
  limit?: number
  status?: TargetSavingsStatus
  type?: TargetSavingsType
  search?: string
} = {}): Promise<TargetSavingsOversightResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.status) query.set('status', params.status)
  if (params.type) query.set('type', params.type)
  if (params.search?.trim()) query.set('search', params.search.trim())
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return authRequest(`/api/superadmin/target-savings${suffix}`, { method: 'GET' })
}
