import {
  ApiError,
  BASE_URL,
  authRequest,
  parseJsonSafely,
  request,
} from "./client";
import type { WalletBalance } from "./finance";
import { getRoscaCircle, type PeerReview } from "./community";

// ── Wallet ──────────────────────────────────────────────────────────────────

export interface PendingWithdrawal {
  reference: string;
  amountKobo: string;
  initiatedAt: string;
}

export interface Wallet {
  id: string;
  currency: string;
  status: string;
  balance: WalletBalance;
  // Stage 11: while a withdrawal is PENDING, every other debit/reserve on the
  // wallet is blocked (contributions, circle joins, savings, another
  // withdrawal). Null when nothing is pending.
  pendingWithdrawal: PendingWithdrawal | null;
  [key: string]: unknown;
}

export async function getWallet(): Promise<Wallet> {
  const res = await authRequest<{ data?: Wallet } | Wallet>("/api/wallet", {
    method: "GET",
  });
  return ("data" in res && res.data ? res.data : res) as Wallet;
}

export interface WalletBucket {
  name: string;
  amount: number;
  [key: string]: unknown;
}

export function getWalletBuckets(): Promise<WalletBucket[]> {
  return authRequest("/api/wallet/buckets", { method: "GET" });
}

export interface WalletStatistics {
  totalInflow: number;
  totalOutflow: number;
  [key: string]: unknown;
}

export function getWalletStatistics(): Promise<WalletStatistics> {
  return authRequest("/api/wallet/statistics", { method: "GET" });
}

export function getWalletStatus(): Promise<{
  status: string;
  [key: string]: unknown;
}> {
  return authRequest("/api/wallet/status", { method: "GET" });
}

export function checkSufficientBalance(
  amount: number,
): Promise<{ sufficient: boolean }> {
  return authRequest(`/api/wallet/balance/check/${amount}`, { method: "GET" });
}

// ── Wallet Funding ────────────────────────────────────────────────────────────

export interface FundingMethod {
  id: string;
  name: string;
  icon: string;
  fee: number;
  minAmount: number;
  description: string;
}

export async function getFundingMethods(): Promise<FundingMethod[]> {
  const res = await authRequest<unknown>("/api/wallet/funding/methods", {
    method: "GET",
  });
  // Response: { success, data: { methods: [...] } }
  if (Array.isArray(res)) return res as FundingMethod[];
  const data = (res as Record<string, unknown>).data;
  if (Array.isArray(data)) return data as FundingMethod[];
  if (data && typeof data === "object") {
    const methods = (data as Record<string, unknown>).methods;
    if (Array.isArray(methods)) return methods as FundingMethod[];
  }
  return [];
}

export interface WithdrawalResponse {
  reference?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export interface LoanApplication {
  circleId: string;
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export function handleFlutterwaveWebhook(
  payload: Record<string, unknown>,
): Promise<{ message: string }> {
  return request("/api/webhooks/flutterwave", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface PendingInvite {
  id: string;
  token: string;
  email: string;
  expiresAt: string;
  createdAt: string;
  circle: {
    id: string;
    name: string;
    contributionAmount: string;
    frequency: string;
    durationCycles: number;
    maxSlots: number;
    filledSlots: number;
    admin: { firstName: string; lastName: string };
  };
}

export async function getMyInvites(): Promise<PendingInvite[]> {
  const res = await authRequest<{ data?: PendingInvite[] } | PendingInvite[]>(
    "/api/rosca/my-invites",
    { method: "GET" },
  );
  return Array.isArray(res)
    ? res
    : ((res as { data?: PendingInvite[] }).data ?? []);
}

export interface InvitePreview {
  token: string;
  email: string;
  expiresAt: string;
  usedAt: string | null;
  circle: {
    name: string;
    contributionAmount: string;
    frequency: string;
    durationCycles: number;
    maxSlots: number;
    filledSlots: number;
    adminName: string;
  };
}

export async function getInvitePreview(token: string): Promise<InvitePreview> {
  const res = await authRequest<{ data: InvitePreview }>(
    `/api/rosca/invite-preview/${token}`,
    { method: "GET" },
  );
  return (res as { data: InvitePreview }).data;
}

export async function joinByInvite(
  token: string,
): Promise<{ message: string }> {
  return authRequest("/api/rosca/join-by-invite", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function messageAdmin(
  circleId: string,
  message: string,
): Promise<{ message: string }> {
  return authRequest(`/api/rosca/${circleId}/message-admin`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// ── Peer Reviews ──────────────────────────────────────────────────────────────

export interface CircleMember {
  userId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  position?: number;
  status?: string;
  joinedAt?: string;
  trustScore?: number;
  [key: string]: unknown;
}

export async function getCircleMembers(
  circleId: string,
): Promise<CircleMember[]> {
  const circle = await getRoscaCircle(circleId);
  return circle.members ?? [];
}

export async function getCirclePeerReviews(
  circleId: string,
): Promise<PeerReview[]> {
  const res = await authRequest<{ data?: PeerReview[] } | PeerReview[]>(
    `/api/rosca/${circleId}/reviews/mine`,
    { method: "GET" },
  );
  return Array.isArray(res)
    ? res
    : ((res as { data?: PeerReview[] }).data ?? []);
}

// ── Admin Access Request ──────────────────────────────────────────────────────

export async function requestAdminAccess(): Promise<{
  message: string;
  role: "CIRCLE_ADMIN";
  sessionRefreshed: boolean;
}> {
  const result = await authRequest<{ message: string; role: "CIRCLE_ADMIN" }>(
    "/api/users/me/request-admin",
    { method: "POST" },
  );

  const currentRefreshToken = localStorage.getItem("refresh_token");
  if (!currentRefreshToken) return { ...result, sessionRefreshed: false };

  try {
    const tokens = await request<{ accessToken: string; refreshToken: string }>(
      "/api/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      },
    );
    localStorage.setItem("access_token", tokens.accessToken);
    localStorage.setItem("refresh_token", tokens.refreshToken);

    const storedUser = JSON.parse(localStorage.getItem("user") ?? "{}");
    localStorage.setItem(
      "user",
      JSON.stringify({ ...storedUser, role: result.role }),
    );
    return { ...result, sessionRefreshed: true };
  } catch {
    return { ...result, sessionRefreshed: false };
  }
}
