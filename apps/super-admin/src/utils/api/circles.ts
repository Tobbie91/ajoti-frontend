import {
  ApiError,
  BASE_URL,
  authRequest,
  parseJsonSafely,
  request,
} from "./client";
import type { PaginatedResponse } from "./users";

// ── Circles ───────────────────────────────────────────────────────────────────

export interface CircleRow {
  id: string;
  name: string;
  status: string;
  contributionAmount: string;
  frequency: string;
  durationCycles: number;
  currentCycle: number;
  memberCount: number;
  admin?: { firstName: string; lastName: string; email: string };
}

export function getAllRoscaCircles(
  params: {
    status?: string;
    adminId?: string;
  } = {},
): Promise<{ success: boolean; data: CircleRow[] }> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/superadmin/rosca/all${q ? `?${q}` : ""}`, {
    method: "GET",
  });
}

export function listCircles(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<PaginatedResponse<CircleRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/superadmin/circles?${q}`, { method: "GET" });
}

export function getDefaulters(
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<unknown>> {
  return authRequest(
    `/api/superadmin/circles/defaulters?page=${page}&limit=${limit}`,
    { method: "GET" },
  );
}

export function getCircleDetail(
  circleId: string,
): Promise<Record<string, unknown>> {
  return authRequest(`/api/superadmin/circles/${circleId}`, { method: "GET" });
}

export function cancelCircle(
  circleId: string,
  reason: string,
): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/circles/${circleId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function flagMember(
  membershipId: string,
  reason: string,
): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/circles/members/${membershipId}/flag`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function releaseCircleCollateral(
  circleId: string,
): Promise<{ success: boolean; data: { released: number; message: string } }> {
  return authRequest(`/api/superadmin/circles/${circleId}/release-collateral`, {
    method: "POST",
  });
}

export function deleteCircle(
  circleId: string,
): Promise<{ success: boolean; data: { deleted: boolean } }> {
  return authRequest(`/api/superadmin/circles/${circleId}`, {
    method: "DELETE",
  });
}

export function releaseUserReservedFunds(
  userId: string,
): Promise<{ success: boolean; data: { released: number; message: string } }> {
  return authRequest(`/api/superadmin/users/${userId}/release-reserved-funds`, {
    method: "POST",
  });
}

export interface ReconcileResult {
  reference: string;
  outcome: string;
  reconciledAt: string;
  transactionId?: string;
  transactionStatus?: string;
  amountKobo?: string;
  reason?: string;
  providerMessage?: string;
}

export function reconcileFunding(
  reference: string,
): Promise<{ success: boolean; message: string; data: ReconcileResult }> {
  return authRequest(
    `/api/admin/funding/reconcile/${encodeURIComponent(reference)}`,
    { method: "POST" },
  );
}

// ── Trust Scores ──────────────────────────────────────────────────────────────

export interface TrustStatsRow {
  userId: string;
  trustScore: number;
  displayScore: number;
  totalExpectedPayments: number;
  totalOnTimePayments: number;
  totalLatePayments: number;
  totalMissedPayments: number;
  totalDefaults: number;
  expectedPostPayoutPayments: number;
  postPayoutOnTimePayments: number;
  totalPeerRatings: number;
  averagePeerRating: number;
  consecutiveLatePayments: number;
  lastUpdated: string;
  user: { firstName: string; lastName: string; email: string };
}

export interface TrustStatsFull extends TrustStatsRow {
  atiBreakdown: {
    recentBehavior: number;
    historyBehavior: number;
    payoutReliability: number;
    peerScore: number;
    historyLength: number;
  } | null;
}

export interface TrustEventResult {
  newTrustScore: number;
  newDisplayScore: number;
}

export function getAllTrustStats(
  params: {
    page?: number;
    limit?: number;
    minScore?: number;
    maxScore?: number;
  } = {},
): Promise<PaginatedResponse<TrustStatsRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ),
  ).toString();
  return authRequest(`/api/superadmin/trust${q ? `?${q}` : ""}`, {
    method: "GET",
  });
}

export async function getTrustStatsFull(
  userId: string,
): Promise<TrustStatsFull> {
  const res = await authRequest<{ data: TrustStatsFull }>(
    `/api/superadmin/trust/${userId}`,
    { method: "GET" },
  );
  return res.data;
}

export async function fireTrustEvent(
  userId: string,
  dto: { eventType: string; rating?: number; isPostPayout?: boolean },
): Promise<TrustEventResult> {
  const res = await authRequest<{ data: TrustEventResult }>(
    `/api/superadmin/trust/${userId}/event`,
    {
      method: "POST",
      body: JSON.stringify(dto),
    },
  );
  return res.data;
}

// ── Simulations ───────────────────────────────────────────────────────────────

export interface SimScoreSnapshot {
  memberLabel: string;
  raw: number;
  display: number;
}
export interface SimEventRecord {
  cycle: string;
  event: string;
  scores: SimScoreSnapshot[];
}
export interface SimMemberResult {
  label: string;
  finalRaw: number;
  finalDisplay: number;
}
export interface SimResult {
  runId: string;
  events: SimEventRecord[];
  finalScores: SimMemberResult[];
}
export interface AutoSimResult {
  runId: string;
  circleA: SimResult;
  circleB: SimResult;
  circleC: SimResult;
}

export interface ManualSimConfig {
  circleName: string;
  contributionAmountKobo: number;
  maxSlots: number;
  frequency: "WEEKLY" | "BI_WEEKLY" | "MONTHLY";
  payoutLogic:
    | "SEQUENTIAL"
    | "RANDOM_DRAW"
    | "TRUST_SCORE"
    | "COMBINED"
    | "ADMIN_ASSIGNED";
  members: { label: string; payoutPosition: number }[];
  cycles: {
    cycleNumber: number;
    contributions: { member: string; timing: "on_time" | "late" | "missed" }[];
    extraTrustEvents?: {
      member: string;
      event: string;
      rating?: number;
      isPostPayout?: boolean;
    }[];
  }[];
  peerReviews?: {
    reviewer: string;
    reviewee: string;
    rating: number;
    comment?: string;
  }[];
}

export function runAutoSimulation(): Promise<{
  success: boolean;
  data: AutoSimResult;
}> {
  return authRequest("/api/superadmin/simulate/auto", { method: "POST" });
}
