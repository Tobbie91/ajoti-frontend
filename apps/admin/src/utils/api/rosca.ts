import {
  ApiError,
  BASE_URL,
  authRequest,
  parseJsonSafely,
  request,
} from "./client";
import type { CircleContribution } from "./community";
import type { CircleMember } from "./member-wallet";

// ── ROSCA (admin) ───────────────────────────────────────────────────────────

export interface RoscaCircle {
  id: string;
  name: string;
  description: string;
  contributionAmount: number;
  frequency: string;
  durationCycles: number;
  currentCycle?: number;
  maxSlots: number;
  totalSlots: number;
  filledSlots: number;
  status: string;
  visibility: string;
  collateralPercentage: number;
  payoutLogic: string;
  autoStartOnFull: boolean;
  latePenaltyPercent: number;
  admin: {
    firstName: string;
    lastName: string;
  };
  members?: CircleMember[];
  [key: string]: unknown;
}

// GET /api/rosca - list circles the admin belongs to
export function listRoscaCircles(): Promise<RoscaCircle[]> {
  return authRequest<{ data?: RoscaCircle[] } | RoscaCircle[]>("/api/rosca", {
    method: "GET",
  }).then((res) => (Array.isArray(res) ? res : (res.data ?? [])));
}

export interface CircleRules {
  collateralRatioPercent: number;
  latePenaltyRatioPercent: number;
  minTrustScore: number;
  postStartExitPenaltyPercent: number;
}

// GET /api/rosca/circle-rules - current platform-wide circle rules (member-facing).
// Always fetch this live for disclosure copy - never hardcode the rate, so the UI
// can't drift from whatever the superadmin has actually configured.
export function getCircleRules(): Promise<{
  success: boolean;
  data: CircleRules;
}> {
  return authRequest("/api/rosca/circle-rules", { method: "GET" });
}

export interface MyJoinRequest {
  membershipId: string;
  circleId: string;
  status: string;
  requestedAt?: string;
  collateralReserved?: string;
  circle?: {
    id?: string;
    name?: string;
    durationCycles?: number;
    currentCycle?: number;
    filledSlots?: number;
    maxSlots?: number;
    frequency?: string;
    contributionAmount?: number | string;
    nextPayoutDate?: string;
    admin?: { firstName?: string; lastName?: string };
  };
  [key: string]: unknown;
}

// GET /api/rosca/my-join-requests - generic authenticated-user endpoint; admins
// are members too, so this reads the admin's own join requests (not the circles
// they administer - that's listAllRoscaCircles).
export async function getMyJoinRequests(): Promise<MyJoinRequest[]> {
  const res = await authRequest<{ data?: MyJoinRequest[] } | MyJoinRequest[]>(
    "/api/rosca/my-join-requests",
    { method: "GET" },
  );
  return Array.isArray(res)
    ? res
    : ((res as { data?: MyJoinRequest[] }).data ?? []);
}

// GET /api/rosca/my-participations - circles the admin (as a member) is actively
// participating in.
export async function getMyParticipations(): Promise<RoscaCircle[]> {
  const res = await authRequest<{ data?: RoscaCircle[] } | RoscaCircle[]>(
    "/api/rosca/my-participations",
    { method: "GET" },
  );
  return Array.isArray(res)
    ? res
    : ((res as { data?: RoscaCircle[] }).data ?? []);
}

// The circles the admin is actually a MEMBER of (participations + approved join
// requests), merged and deduped by circleId - distinct from listAllRoscaCircles,
// which is circles the admin ADMINISTERS. Anywhere that needs "my memberships"
// (e.g. the loan application's group selector) should use this.
export async function getMyActiveCircles(): Promise<RoscaCircle[]> {
  const [participations, joinRequests] = await Promise.all([
    getMyParticipations().catch(() => []),
    getMyJoinRequests().catch(() => []),
  ]);

  const approvedRequests = joinRequests.filter((r) =>
    ["ACTIVE", "STARTED"].includes((r.status ?? "").toUpperCase()),
  );

  const seenIds = new Set<string>();
  const merged: RoscaCircle[] = [];
  for (const c of participations) {
    if (!seenIds.has(c.id)) {
      seenIds.add(c.id);
      merged.push(c);
    }
  }
  for (const r of approvedRequests) {
    const c = r.circle;
    if (c?.id && !seenIds.has(c.id)) {
      seenIds.add(c.id);
      merged.push({
        id: c.id,
        name: c.name ?? `Circle ${c.id.slice(0, 6)}`,
        description: "",
        contributionAmount: Number(c.contributionAmount ?? 0),
        frequency: c.frequency ?? "",
        durationCycles: c.durationCycles ?? 0,
        maxSlots: c.maxSlots ?? 0,
        totalSlots: c.maxSlots ?? 0,
        filledSlots: c.filledSlots ?? 0,
        status: r.status,
        visibility: "",
        collateralPercentage: 0,
        payoutLogic: "",
        autoStartOnFull: false,
        latePenaltyPercent: 0,
        admin: {
          firstName: c.admin?.firstName ?? "",
          lastName: c.admin?.lastName ?? "",
        },
      });
    }
  }
  return merged;
}

// ── Debts ─────────────────────────────────────────────────────────────────────

export type DebtCategory = "MISSED_CONTRIBUTION" | "LATE_PENALTY" | "MIXED";

export interface Debt {
  id: string;
  circleId: string;
  circleName?: string;
  cycleNumber: number;
  status: string;
  category: DebtCategory;
  categoryLabel: string;
  outstandingTotal: string;
  outstandingBreakdown: {
    contribution: string;
    interest: string;
    bridge: string;
    collateral: string;
    penalty: string;
  };
  blocksLoanEligibility: boolean;
  createdAt: string;
  settledAt: string | null;
}

export async function getMyDebts(): Promise<Debt[]> {
  const res = await authRequest<{ success: boolean; data: Debt[] }>(
    "/api/debts/mine",
    { method: "GET" },
  );
  return res.data;
}

export async function repayDebt(
  debtId: string,
  amountKobo?: number,
): Promise<Debt> {
  const res = await authRequest<{
    success: boolean;
    message: string;
    data: Debt;
  }>(`/api/debts/${debtId}/repay`, {
    method: "POST",
    body: JSON.stringify(amountKobo !== undefined ? { amountKobo } : {}),
  });
  return res.data;
}

// GET /api/admin/rosca/my-circles - view admin's own circles
export function listAllRoscaCircles(): Promise<RoscaCircle[]> {
  return authRequest("/api/admin/rosca/my-circles", { method: "GET" });
}

// GET /api/admin/rosca/{circleId} - get circle details
export async function getAdminCircleDetail(
  circleId: string,
): Promise<RoscaCircle> {
  const res = await authRequest<{ data?: RoscaCircle } | RoscaCircle>(
    `/api/admin/rosca/${circleId}`,
    { method: "GET" },
  );
  return ("data" in res && res.data ? res.data : res) as RoscaCircle;
}

// POST /api/admin/rosca - create a new ROSCA circle
export interface CreateRoscaPayload {
  name: string;
  description: string;
  contributionAmount: string;
  frequency: "MONTHLY" | "WEEKLY" | "BI_WEEKLY";
  durationCycles: number;
  maxSlots: number;
  payoutLogic: string;
  visibility: string;
}

export function createRoscaCircle(
  payload: CreateRoscaPayload,
): Promise<RoscaCircle> {
  return authRequest("/api/admin/rosca", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PATCH /api/admin/rosca/{circleId} - update a DRAFT circle's configuration.
// payoutLogic is deliberately NOT here - use updatePayoutConfig instead, the
// dedicated endpoint (backend rejects payoutLogic on this DTO entirely).
export interface UpdateRoscaPayload {
  name?: string;
  description?: string;
  contributionAmount?: string;
  maxSlots?: number;
  frequency?: "MONTHLY" | "WEEKLY" | "BI_WEEKLY";
  visibility?: string;
  initialContributionDeadline?: string;
}

export function updateRoscaCircle(
  circleId: string,
  payload: UpdateRoscaPayload,
): Promise<RoscaCircle> {
  return authRequest(`/api/admin/rosca/${circleId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// PATCH /api/admin/rosca/{circleId}/activate - activate a circle
export function activateRoscaCircle(
  circleId: string,
  startDate: string,
): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/activate`, {
    method: "PATCH",
    body: JSON.stringify({ initialContributionDeadline: startDate }),
  });
}

// PATCH /api/admin/rosca/{circleId}/close - close (cancel) a circle
export function closeRoscaCircle(
  circleId: string,
): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/close`, { method: "PATCH" });
}

// GET /api/admin/rosca/dashboard - admin dashboard stats
export interface AdminDashboard {
  totalGroups: number;
  nextDeadline: { groupName: string; deadline: string } | null;
  pendingJoinRequests: {
    total: number;
    breakdown: { groupName: string; pendingCount: number }[];
  };
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const res = await authRequest<{ data?: AdminDashboard } | AdminDashboard>(
    "/api/admin/rosca/dashboard",
    { method: "GET" },
  );
  return ("data" in res && res.data ? res.data : res) as AdminDashboard;
}

// GET /api/admin/rosca/join-requests - list circles with pending join requests
export interface CirclePendingRequests {
  circleId: string;
  name: string;
  pendingCount: number;
  oldestRequestAt: string;
}

export async function getJoinRequests(): Promise<CirclePendingRequests[]> {
  const res = await authRequest<
    { data?: CirclePendingRequests[] } | CirclePendingRequests[]
  >("/api/admin/rosca/join-requests", { method: "GET" });
  return Array.isArray(res)
    ? res
    : ((res as { data?: CirclePendingRequests[] }).data ?? []);
}

export interface JoinRequesterDossier {
  userId: string;
  membershipId: string;
  name: string;
  requestedAt: string;
  trustScore: number;
  onTimePaymentRate: number | null;
  completedCycles: number;
}

export async function getCircleJoinRequests(
  circleId: string,
): Promise<JoinRequesterDossier[]> {
  const res = await authRequest<
    { data?: JoinRequesterDossier[] } | JoinRequesterDossier[]
  >(`/api/admin/rosca/${circleId}/join-requests`, { method: "GET" });
  return Array.isArray(res)
    ? res
    : ((res as { data?: JoinRequesterDossier[] }).data ?? []);
}

// PATCH /api/admin/rosca/{circleId}/members/{userId}/approve - approve a member
export function approveMember(
  circleId: string,
  userId: string,
): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/members/${userId}/approve`, {
    method: "PATCH",
  });
}

// PATCH /api/admin/rosca/{circleId}/members/{userId}/reject - reject a member
export function rejectMember(
  circleId: string,
  userId: string,
): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/members/${userId}/reject`, {
    method: "PATCH",
  });
}

// GET /api/admin/rosca/{circleId}/payout-config - get current payout config
export interface PayoutAssignment {
  userId: string;
  name: string;
  position: number | null;
}

export interface PayoutConfig {
  payoutLogic: string;
  allAssigned: boolean;
  assignments: PayoutAssignment[];
}

export async function getPayoutConfig(circleId: string): Promise<PayoutConfig> {
  const res = await authRequest<{ data?: PayoutConfig } | PayoutConfig>(
    `/api/admin/rosca/${circleId}/payout-config`,
    { method: "GET" },
  );
  return ("data" in res && res.data ? res.data : res) as PayoutConfig;
}

// PATCH /api/admin/rosca/{circleId}/payout-config - update payout config
export function updatePayoutConfig(
  circleId: string,
  config: {
    payoutLogic?: string;
    assignments: { userId: string; position: number }[];
  },
): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/payout-config`, {
    method: "PATCH",
    body: JSON.stringify(config),
  });
}

export interface RoscaSchedule {
  id?: string;
  cycleNumber?: number;
  contributionDeadline?: string;
  payoutDate?: string;
  recipientId?: string | null;
  month?: string;
  recipient?: string;
  status: string;
  [key: string]: unknown;
}

export function getRoscaSchedules(circleId: string): Promise<RoscaSchedule[]> {
  return authRequest<{ data?: RoscaSchedule[] } | RoscaSchedule[]>(
    `/api/rosca/${circleId}/schedules`,
    { method: "GET" },
  ).then((res) => (Array.isArray(res) ? res : (res.data ?? [])));
}

// ── Payouts ──────────────────────────────────────────────────────────────────

export interface Payout {
  id: string;
  cycleNumber?: number;
  recipientId?: string;
  recipient?: { firstName: string; lastName: string; email?: string };
  amount: string;
  status: string;
  createdAt?: string;
  processedAt?: string;
  schedule?: { cycleNumber: number; payoutDate: string };
  [key: string]: unknown;
}

export async function getPayoutHistory(circleId: string): Promise<Payout[]> {
  const res = await authRequest<{ data?: Payout[] } | Payout[]>(
    `/api/rosca/${circleId}/payouts`,
    { method: "GET" },
  );
  return Array.isArray(res) ? res : ((res as { data?: Payout[] }).data ?? []);
}

export function processPayout(
  circleId: string,
  cycleNumber: number,
): Promise<{ message: string }> {
  return authRequest(`/api/admin/payouts/${circleId}/process/${cycleNumber}`, {
    method: "POST",
  });
}

export function retryPayout(payoutId: string): Promise<{ message: string }> {
  return authRequest(`/api/admin/payouts/${payoutId}/retry`, {
    method: "POST",
  });
}

export interface ReversePayoutPayload {
  originalPayoutId: string;
  recipientId: string;
  scheduleId: string;
  amount: string;
  reason: string;
}

export function reversePayout(
  payload: ReversePayoutPayload,
): Promise<{ message: string }> {
  return authRequest("/api/admin/payouts/reverse", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function triggerPayoutScheduler(): Promise<{ message: string }> {
  return authRequest("/api/admin/payouts/trigger-scheduler", {
    method: "POST",
  });
}

// ── Contributions ─────────────────────────────────────────────────────────────

export interface Contribution {
  contributionId: string;
  userId: string;
  memberName: string;
  cycleNumber: number;
  amount: string;
  penaltyAmount: string;
  isLate: boolean;
  paidAt: string | null;
  [key: string]: unknown;
}

export async function getAllCircleContributions(
  circleId: string,
): Promise<Contribution[]> {
  const res = await authRequest<{ data?: Contribution[] }>(
    `/api/admin/rosca/${circleId}/contributions-all`,
    { method: "GET" },
  );
  return (res as { data?: Contribution[] }).data ?? [];
}

// GET /api/admin/rosca/{circleId}/disbursements - admin view of disbursements
export interface Disbursement {
  cycleNumber: number;
  recipientId: string;
  recipientName: string;
  payoutDate: string;
  contributionDeadline: string;
  scheduleStatus: string;
  payoutStatus: string | null;
  amountPaidOut: string | null;
  processedAt: string | null;
  [key: string]: unknown;
}

export async function getAdminDisbursements(
  circleId: string,
): Promise<Disbursement[]> {
  const res = await authRequest<{ data?: { schedules?: Disbursement[] } }>(
    `/api/admin/rosca/${circleId}/disbursements`,
    { method: "GET" },
  );
  return (
    (res as { data?: { schedules?: Disbursement[] } }).data?.schedules ?? []
  );
}

export function extendCycleDeadline(
  circleId: string,
  cycleNumber: number,
  newPayoutDate: string,
): Promise<{ message: string }> {
  return authRequest(
    `/api/admin/rosca/${circleId}/schedules/${cycleNumber}/extend`,
    {
      method: "PATCH",
      body: JSON.stringify({ newPayoutDate }),
    },
  );
}

// GET /api/admin/rosca/{circleId}/contributions - admin view of contributions
export interface AdminContribution {
  contributionId: string;
  userId: string;
  memberName: string;
  amount: string;
  penaltyAmount: string;
  isLate: boolean;
  paidAt: string;
}

export interface AdminContributionsResponse {
  cycleNumber: number;
  contributions: AdminContribution[];
  totalCollected: string;
  totalPenalties: string;
}

export async function getAdminCircleContributions(
  circleId: string,
  cycleNumber?: number,
): Promise<AdminContributionsResponse> {
  const url =
    cycleNumber != null
      ? `/api/admin/rosca/${circleId}/contributions?round=${cycleNumber}`
      : `/api/admin/rosca/${circleId}/contributions`;
  const res = await authRequest<{ data?: AdminContributionsResponse }>(url, {
    method: "GET",
  });
  return (
    (res as { data?: AdminContributionsResponse }).data ?? {
      cycleNumber: cycleNumber ?? 1,
      contributions: [],
      totalCollected: "0",
      totalPenalties: "0",
    }
  );
}

export async function makeContribution(
  circleId: string,
  cycleNumber: number,
): Promise<CircleContribution> {
  const res = await authRequest<
    { data?: CircleContribution } | CircleContribution
  >(`/api/rosca/${circleId}/contributions`, {
    method: "POST",
    body: JSON.stringify({ cycleNumber }),
  });
  return ("data" in res && res.data ? res.data : res) as CircleContribution;
}
