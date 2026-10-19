import { authRequest } from './client'
import type { CycleHealth } from './community'

// Stage 4 responses are intentionally separate from owner reconciliation and personal receipts.
export interface SharedHealth {
  circleId: string; totalCollected: string; contributionAmount: string; filledSlots: number; cycles: CycleHealth[]
}
export interface SharedProgress {
  circleId: string; durationCycles: number;
  members: { userId: string; name: string; completedCycles: number; durationCycles: number; payoutStatus: string; payoutPosition: number | null }[]
}
export interface ContributionSummary {
  circleId: string; cycleNumber: number; totalCollected: string;
  contributions: { memberName: string; amount: string; paidAt: string | null }[]
}
export interface SharedDisbursement {
  cycleNumber: number; recipientName: string | null; payoutDate: string; contributionDeadline: string;
  scheduleStatus: string; payoutStatus: string | null; amountPaidOut: string | null; processedAt: string | null
}
export interface RatingSummary { userId: string; name: string; averageRating: number | null; totalReviews: number }
async function read<T>(circleId: string, suffix: string): Promise<T> {
  const result = await authRequest<{ success: boolean; data: T }>(`/api/rosca/${encodeURIComponent(circleId)}/${suffix}`, { method: 'GET' })
  if (result.success === false || result.data == null) throw new Error('Circle data is unavailable. Please try again.')
  return result.data
}
function checkArray(value: unknown): void { if (!Array.isArray(value)) throw new Error('Circle response is incomplete.') }
export async function getSharedHealth(id: string) { const data = await read<SharedHealth>(id, 'financial-health'); checkArray(data.cycles); return data }
export async function getSharedProgress(id: string) { const data = await read<SharedProgress>(id, 'progress'); checkArray(data.members); return data }
export async function getContributionSummary(id: string, cycleNumber?: number) { const data = await read<ContributionSummary>(id, `contribution-summary${cycleNumber == null ? '' : `?cycleNumber=${cycleNumber}`}`); checkArray(data.contributions); return data }
export async function getSharedDisbursements(id: string) { const data = await read<{ circleId: string; schedules: SharedDisbursement[] }>(id, 'disbursements'); checkArray(data.schedules); return data }
export async function getRatingSummary(id: string) { const data = await read<RatingSummary[]>(id, 'reviews/summary'); checkArray(data); return data }
