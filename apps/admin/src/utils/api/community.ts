import {
  ApiError,
  BASE_URL,
  authRequest,
  client,
  parseJsonSafely,
  request,
} from "./client";
import type { RoscaCircle } from "./rosca";

// ── Circle Invites ─────────────────────────────────────────────────────────────

export interface CircleInvite {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export async function sendCircleInvite(
  circleId: string,
  payload: { email: string },
): Promise<{ message: string; data?: CircleInvite }> {
  return authRequest(`/api/admin/rosca/${circleId}/invites`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCircleInvites(
  circleId: string,
): Promise<CircleInvite[]> {
  const res = await authRequest<{ data?: CircleInvite[] } | CircleInvite[]>(
    `/api/admin/rosca/${circleId}/invites`,
    { method: "GET" },
  );
  return Array.isArray(res)
    ? res
    : ((res as { data?: CircleInvite[] }).data ?? []);
}

export interface PeerReview {
  id: string;
  circleId?: string;
  reviewerId: string;
  reviewerName?: string;
  revieweeId: string;
  revieweeName?: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewee?: { firstName?: string; lastName?: string; [key: string]: unknown };
  reviewer?: { firstName?: string; lastName?: string; [key: string]: unknown };
  [key: string]: unknown;
}

// GET /api/rosca/:circleId/reviews — CIRCLE_ADMIN (own circle) or STAFF only
export async function getCircleReviews(
  circleId: string,
): Promise<PeerReview[]> {
  const res = await authRequest<{ data?: PeerReview[] } | PeerReview[]>(
    `/api/rosca/${circleId}/reviews`,
    { method: "GET" },
  );
  return Array.isArray(res)
    ? res
    : ((res as { data?: PeerReview[] }).data ?? []);
}

// POST /api/rosca/:circleId/reviews — circle must be COMPLETED, one review per reviewer/reviewee/circle
export async function submitPeerReview(
  circleId: string,
  payload: { revieweeId: string; rating: number; comment?: string },
): Promise<PeerReview> {
  const res = await authRequest<{ data?: PeerReview } | PeerReview>(
    `/api/rosca/${circleId}/reviews`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  return ("data" in res && res.data ? res.data : res) as PeerReview;
}

export function revokeCircleInvite(
  circleId: string,
  inviteId: string,
): Promise<{ message: string }> {
  return authRequest(`/api/admin/rosca/${circleId}/invites/${inviteId}`, {
    method: "DELETE",
  });
}

// ── Member Progress ────────────────────────────────────────────────────────────

export interface MemberProgress {
  userId: string;
  name: string;
  roundsPaid?: number;
  totalRounds?: number;
  missedPayments?: number;
  status?: string;
  payoutPosition?: number;
  [key: string]: unknown;
}

interface MemberProgressApiItem {
  userId: string;
  name: string;
  completedCycles: number;
  durationCycles: number;
  payoutStatus: string;
  payoutPosition: number;
  totalLatePayments: number;
}

export async function getMemberProgress(
  circleId: string,
): Promise<MemberProgress[]> {
  const res = await authRequest<{
    data?: { members?: MemberProgressApiItem[] };
  }>(`/api/admin/rosca/${circleId}/members/progress`, { method: "GET" });
  const members =
    (res as { data?: { members?: MemberProgressApiItem[] } }).data?.members ??
    [];
  return members.map((m) => ({
    userId: m.userId,
    name: m.name,
    roundsPaid: m.completedCycles,
    totalRounds: m.durationCycles,
    missedPayments: m.totalLatePayments,
    status: m.payoutStatus,
    payoutPosition: m.payoutPosition,
  }));
}

// ── Notify Missing Contributors ────────────────────────────────────────────────

export async function notifyMissingContributors(
  circleId: string,
  payload: { roundNumber?: number; memberIds?: string[]; message?: string },
): Promise<{ message: string; notified?: number }> {
  return authRequest(`/api/admin/rosca/${circleId}/notify-missing`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── Financial Health ───────────────────────────────────────────────────────────

export interface CycleHealth {
  cycleNumber: number;
  contributionDeadline?: string;
  scheduleStatus: string;
  expectedPot: string;
  collected: string;
  outstanding: string;
  expectedCount: number;
  collectedCount: number;
  [key: string]: unknown;
}

export interface FinancialHealth {
  circleId?: string;
  contributionAmount?: string;
  filledSlots?: number;
  cycles?: CycleHealth[];
  [key: string]: unknown;
}

export async function getFinancialHealth(
  circleId: string,
): Promise<FinancialHealth> {
  const res = await authRequest<{ data?: FinancialHealth } | FinancialHealth>(
    `/api/admin/rosca/${circleId}/financial-health`,
    { method: "GET" },
  );
  return (
    "data" in (res as object) && (res as Record<string, unknown>).data
      ? (res as Record<string, unknown>).data
      : res
  ) as FinancialHealth;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  circleId: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  body: string;
  createdAt: string;
}

export interface ChatCircle {
  id: string;
  name: string;
  lastMessage: ChatMessage | null;
}

export function getChatBaseUrl(): string {
  return client.getBaseUrl();
}

export function getAccessToken(): string | null {
  return client.getAccessToken();
}

export async function getChatCircles(): Promise<ChatCircle[]> {
  return authRequest("/api/chat/circles", { method: "GET" });
}

export async function getChatMessages(
  circleId: string,
  before?: string,
): Promise<ChatMessage[]> {
  const qs = before ? `?before=${encodeURIComponent(before)}` : "";
  return authRequest(`/api/chat/circles/${circleId}/messages${qs}`, {
    method: "GET",
  });
}

// ── Support Tickets ───────────────────────────────────────────────────────────

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketCategory =
  | "ACCOUNT"
  | "WALLET"
  | "TRANSACTION"
  | "KYC"
  | "ROSCA"
  | "LOAN"
  | "OTHER";
export type TicketSenderRole = "USER" | "ADMIN" | "SUPERADMIN";

export interface SupportMessage {
  id: string;
  body: string;
  senderRole: TicketSenderRole;
  sender: { id: string; firstName: string; lastName: string; role: string };
  createdAt: string;
}

export interface SupportTicketRow {
  id: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  refType: string | null;
  refId: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Pick<SupportMessage, "body" | "createdAt" | "senderRole">[];
  _count: { messages: number };
}

export interface SupportTicketDetail extends SupportTicketRow {
  messages: SupportMessage[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function listMyTickets(
  params: {
    page?: number;
    limit?: number;
    status?: TicketStatus | "";
    category?: TicketCategory | "";
  } = {},
): Promise<PaginatedResponse<SupportTicketRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/support/tickets?${q}`, { method: "GET" });
}

export function getMyTicket(ticketId: string): Promise<SupportTicketDetail> {
  return authRequest(`/api/support/tickets/${ticketId}`, { method: "GET" });
}

export function createTicket(payload: {
  category: TicketCategory;
  subject: string;
  body: string;
  refType?: string;
  refId?: string;
}): Promise<SupportTicketDetail> {
  return authRequest("/api/support/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function replyToTicket(
  ticketId: string,
  body: string,
): Promise<SupportMessage> {
  return authRequest(`/api/support/tickets/${ticketId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function closeMyTicket(
  ticketId: string,
): Promise<{ id: string; status: TicketStatus }> {
  return authRequest(`/api/support/tickets/${ticketId}/close`, {
    method: "PATCH",
  });
}

// Customer capabilities retained from the retired member application.
export interface ProveInitiateResult {
  monoUrl: string | null; // null = test bypass (auto-verified, skip widget)
  reference: string;
}

export function resendResetOtp(email: string): Promise<{ message: string }> {
  return request("/api/auth/resend-reset-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export function changePassword(
  payload: ChangePasswordPayload,
): Promise<{ message: string }> {
  return authRequest("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function leaveRoscaCircle(
  circleId: string,
): Promise<{ success: boolean; message: string }> {
  return authRequest(`/api/rosca/${circleId}/leave`, { method: "DELETE" });
}

export function joinRoscaCircle(
  circleId: string,
): Promise<{ message: string }> {
  return authRequest(`/api/rosca/${circleId}/join`, { method: "POST" });
}

export async function getRoscaCircle(circleId: string): Promise<RoscaCircle> {
  const res = await authRequest<{ data?: RoscaCircle } | RoscaCircle>(
    `/api/rosca/${circleId}`,
    { method: "GET" },
  );
  return ("data" in res && res.data ? res.data : res) as RoscaCircle;
}

export interface CircleContribution {
  id: string;
  cycleNumber: number;
  amount: string;
  penaltyAmount: string;
  paidAt: string;
}

export async function getCircleContributions(
  circleId: string,
): Promise<CircleContribution[]> {
  const res = await authRequest<
    { data?: CircleContribution[] } | CircleContribution[]
  >(`/api/rosca/${circleId}/contributions`, { method: "GET" });
  return Array.isArray(res) ? res : (res.data ?? []);
}
