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
  if (result.success !== true || result.data == null) throw new Error('Circle data is unavailable. Please try again.')
  return result.data
}
function checkArray(value: unknown): void { if (!Array.isArray(value)) throw new Error('Circle response is incomplete.') }
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const nonnegativeInt = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const koboString = (value: unknown) => typeof value === 'string' && /^\d+$/.test(value)
const nullableString = (value: unknown) => value == null || typeof value === 'string'
const validHealthCycle = (value: unknown): value is CycleHealth => record(value)
  && nonnegativeInt(value.cycleNumber) && value.cycleNumber > 0
  && nullableString(value.contributionDeadline) && typeof value.scheduleStatus === 'string'
  && koboString(value.expectedPot) && koboString(value.collected) && koboString(value.outstanding)
  && nonnegativeInt(value.expectedCount) && nonnegativeInt(value.collectedCount)
export async function getSharedHealth(id: string) {
  const data = await read<SharedHealth>(id, 'financial-health')
  checkArray(data.cycles)
  if (typeof data.circleId !== 'string' || !koboString(data.totalCollected) || !koboString(data.contributionAmount)
    || !nonnegativeInt(data.filledSlots) || data.cycles.some(cycle => !validHealthCycle(cycle))) {
    throw new Error('Circle financial health is incomplete. Please try again.')
  }
  return data
}
export async function getSharedProgress(id: string) {
  const data = await read<SharedProgress>(id, 'progress')
  checkArray(data.members)
  if (typeof data.circleId !== 'string' || !nonnegativeInt(data.durationCycles) || data.members.some(member =>
    !record(member) || typeof member.userId !== 'string' || typeof member.name !== 'string'
    || !nonnegativeInt(member.completedCycles) || !nonnegativeInt(member.durationCycles)
    || typeof member.payoutStatus !== 'string' || !(member.payoutPosition == null || nonnegativeInt(member.payoutPosition)))) {
    throw new Error('Circle progress is incomplete. Please try again.')
  }
  return data
}
export async function getContributionSummary(id: string, cycleNumber?: number) {
  const data = await read<ContributionSummary>(id, `contribution-summary${cycleNumber == null ? '' : `?cycleNumber=${cycleNumber}`}`)
  checkArray(data.contributions)
  if (typeof data.circleId !== 'string' || !nonnegativeInt(data.cycleNumber) || !koboString(data.totalCollected)
    || data.contributions.some(item => !record(item) || typeof item.memberName !== 'string' || !koboString(item.amount) || !nullableString(item.paidAt))) {
    throw new Error('Contribution summary is incomplete. Please try again.')
  }
  return data
}
export async function getSharedDisbursements(id: string) {
  const data = await read<{ circleId: string; schedules: SharedDisbursement[] }>(id, 'disbursements')
  checkArray(data.schedules)
  if (typeof data.circleId !== 'string' || data.schedules.some(item => !record(item)
    || !nonnegativeInt(item.cycleNumber) || item.cycleNumber === 0
    || !nullableString(item.recipientName) || typeof item.payoutDate !== 'string'
    || typeof item.contributionDeadline !== 'string' || typeof item.scheduleStatus !== 'string'
    || !nullableString(item.payoutStatus) || !(item.amountPaidOut == null || koboString(item.amountPaidOut))
    || !nullableString(item.processedAt))) {
    throw new Error('Payout schedules are incomplete. Please try again.')
  }
  return data
}
export async function getRatingSummary(id: string) {
  const data = await read<RatingSummary[]>(id, 'reviews/summary')
  checkArray(data)
  if (data.some(item => !record(item) || typeof item.userId !== 'string' || typeof item.name !== 'string'
    || !(item.averageRating == null || (typeof item.averageRating === 'number' && Number.isFinite(item.averageRating) && item.averageRating >= 1 && item.averageRating <= 5))
    || !nonnegativeInt(item.totalReviews))) {
    throw new Error('Peer rating summary is incomplete. Please try again.')
  }
  return data
}
