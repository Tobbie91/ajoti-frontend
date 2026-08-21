import {
  ApiError,
  BASE_URL,
  authRequest,
  parseJsonSafely,
  request,
} from "./client";
import type { PaginatedResponse } from "./users";
import type { ManualSimConfig, SimResult } from "./circles";

// ── Support ───────────────────────────────────────────────────────────────────

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
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  assignedTo: { id: string; firstName: string; lastName: string } | null;
  messages: Pick<SupportMessage, "body" | "createdAt" | "senderRole">[];
  _count: { messages: number };
}

export interface SupportTicketDetail extends SupportTicketRow {
  messages: SupportMessage[];
}

export function listSupportTickets(params: {
  page?: number;
  limit?: number;
  status?: TicketStatus | "";
  category?: TicketCategory | "";
  search?: string;
}): Promise<PaginatedResponse<SupportTicketRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/superadmin/support?${q}`, { method: "GET" });
}

export function getSupportTicketDetail(
  ticketId: string,
): Promise<SupportTicketDetail> {
  return authRequest(`/api/superadmin/support/${ticketId}`, { method: "GET" });
}

export function replySupportTicket(
  ticketId: string,
  body: string,
): Promise<SupportMessage> {
  return authRequest(`/api/superadmin/support/${ticketId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function assignSupportTicket(
  ticketId: string,
  assignedToId?: string,
): Promise<{ id: string; assignedToId: string; status: TicketStatus }> {
  return authRequest(`/api/superadmin/support/${ticketId}/assign`, {
    method: "PATCH",
    body: JSON.stringify(assignedToId ? { assignedToId } : {}),
  });
}

export function updateSupportTicketStatus(
  ticketId: string,
  status: "IN_PROGRESS" | "RESOLVED" | "CLOSED",
): Promise<SupportTicketDetail> {
  return authRequest(`/api/superadmin/support/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function setStaffRole(
  userId: string,
  staffRole: "SUPPORT" | "COMPLIANCE" | "OPERATIONS" | "MANAGER" | "SUPERADMIN",
): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/users/${userId}/staff-role`, {
    method: "PATCH",
    body: JSON.stringify({ staffRole }),
  });
}

export function runManualSimulation(
  dto: ManualSimConfig,
): Promise<{ success: boolean; data: SimResult }> {
  return authRequest("/api/superadmin/simulate/manual", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// ── Sandbox ───────────────────────────────────────────────────────────────────

export interface SandboxUser {
  id: string;
  label: string;
  email: string;
  walletId: string;
  role: string;
}
export interface SandboxUsersResult {
  runId: string;
  users: SandboxUser[];
}
export interface SandboxCircleResult {
  runId: string;
  circleId: string;
  adminId: string;
  memberIds: string[];
  durationCycles: number;
}
export interface SandboxCycleMemberResult {
  userId: string;
  contributed: boolean;
  timing: string;
  trustScore: { raw: number; display: number };
}
export interface SandboxCycleResult {
  circleId: string;
  cycleNumber: number;
  members: SandboxCycleMemberResult[];
  payout: {
    payoutId: string;
    recipientId: string;
    amount: string;
    isLastCycle: boolean;
    status: string;
  };
}
export interface LedgerEntryRow {
  id: string;
  entryType: string;
  movementType: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  reference: string;
  sourceType: string;
  createdAt: string;
}
export interface LedgerInspectResult {
  walletId: string;
  entryCount: number;
  reportedBalance: string;
  computedBalance: string;
  isReconciled: boolean;
  discrepancy: string;
  entries: LedgerEntryRow[];
}
export interface WalletReconcileRow {
  walletId: string;
  userId: string;
  isReconciled: boolean;
  reportedBalance: string;
  computedBalance: string;
  discrepancy: string;
  entryCount: number;
}
export interface ReconcileRunResult {
  runId: string;
  allReconciled: boolean;
  wallets: WalletReconcileRow[];
}

export function sandboxCreateUsers(dto: {
  runId?: string;
  count: number;
  fundAmountKobo?: number;
}): Promise<{ success: boolean; data: SandboxUsersResult }> {
  return authRequest("/api/superadmin/simulate/sandbox/users", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function sandboxCreateCircle(dto: {
  runId: string;
  memberIds: string[];
  adminId?: string;
  name: string;
  contributionAmountKobo: number;
  frequency: string;
  payoutLogic: string;
  assignments?: { userId: string; position: number }[];
}): Promise<{ success: boolean; data: SandboxCircleResult }> {
  return authRequest("/api/superadmin/simulate/sandbox/circle", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function sandboxRunCycle(dto: {
  circleId: string;
  cycleNumber: number;
  contributions: { userId: string; timing: "on_time" | "late" | "skip" }[];
}): Promise<{ success: boolean; data: SandboxCycleResult }> {
  return authRequest("/api/superadmin/simulate/sandbox/cycle", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function sandboxApplyLoan(dto: {
  userId: string;
  circleId: string;
}): Promise<{ success: boolean; data: unknown }> {
  return authRequest("/api/superadmin/simulate/sandbox/loan", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function sandboxInspectLedger(
  walletId: string,
): Promise<{ success: boolean; data: LedgerInspectResult }> {
  return authRequest(`/api/superadmin/simulate/sandbox/ledger/${walletId}`, {
    method: "GET",
  });
}

export function sandboxReconcile(
  runId: string,
): Promise<{ success: boolean; data: ReconcileRunResult }> {
  return authRequest(`/api/superadmin/simulate/sandbox/reconcile/${runId}`, {
    method: "GET",
  });
}

export function sandboxReset(
  runId: string,
): Promise<{ success: boolean; message: string; data: { deleted: number } }> {
  return authRequest(`/api/superadmin/simulate/sandbox/reset/${runId}`, {
    method: "DELETE",
  });
}

// ── Staff IAM ─────────────────────────────────────────────────────────────────

export type StaffAdminRole =
  | "SUPPORT"
  | "COMPLIANCE"
  | "OPERATIONS"
  | "MANAGER"
  | "SUPERADMIN";
export type StaffStatus = "ACTIVE" | "SUSPENDED" | "PENDING";

export interface StaffUserRow {
  type: "USER";
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  staffRole: StaffAdminRole;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
}

export interface StaffInviteRow {
  type: "INVITE";
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  staffRole: StaffAdminRole;
  status: "PENDING";
  createdAt: string;
  expiresAt: string;
  invitedBy: { firstName: string; lastName: string } | null;
}

export type StaffRow = StaffUserRow | StaffInviteRow;

export interface StaffAuditLogRow {
  id: string;
  actorId: string;
  actorType: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  createdAt: string;
}

export function listStaff(
  params: {
    page?: number;
    limit?: number;
    staffRole?: StaffAdminRole;
    status?: "ACTIVE" | "SUSPENDED";
  } = {},
): Promise<PaginatedResponse<StaffRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && (v as unknown) !== "",
      ),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/superadmin/staff?${q}`, { method: "GET" });
}

export function inviteStaff(dto: {
  email: string;
  firstName: string;
  lastName: string;
  staffRole: StaffAdminRole;
}): Promise<{ message: string }> {
  return authRequest("/api/superadmin/staff/invite", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// Creates a real, immediately-active staff account with an admin-supplied TEMPORARY
// password — the new staff member must change it at first login before they can do
// anything else. No email is sent; the admin hands over the credentials directly.
export function createStaff(dto: {
  email: string;
  firstName: string;
  lastName: string;
  staffRole: StaffAdminRole;
  phone: string;
  dob: string;
  gender: "MALE" | "FEMALE";
  tempPassword: string;
}): Promise<{ message: string; userId: string }> {
  return authRequest("/api/superadmin/staff/create", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function changeStaffRole(
  staffId: string,
  staffRole: StaffAdminRole,
): Promise<{ message: string }> {
  return authRequest(`/api/superadmin/staff/${staffId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ staffRole }),
  });
}

export function suspendStaff(staffId: string): Promise<{ message: string }> {
  return authRequest(`/api/superadmin/staff/${staffId}/suspend`, {
    method: "PATCH",
  });
}

export function reactivateStaff(staffId: string): Promise<{ message: string }> {
  return authRequest(`/api/superadmin/staff/${staffId}/reactivate`, {
    method: "PATCH",
  });
}

export function cancelStaffInvite(
  inviteId: string,
): Promise<{ message: string }> {
  return authRequest(`/api/superadmin/staff/invites/${inviteId}`, {
    method: "DELETE",
  });
}

export function getStaffAuditLog(
  params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<PaginatedResponse<StaffAuditLogRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/superadmin/staff/audit-log?${q}`, { method: "GET" });
}

export function staffSetup(dto: {
  token: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: "MALE" | "FEMALE";
  phone: string;
  password: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  message: string;
}> {
  return request("/api/auth/staff/setup", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// ── Account ──────────────────────────────────────────────────────────────────

export function changePassword(dto: {
  oldPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return authRequest("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function forgotPassword(email: string): Promise<{ message: string }> {
  return request("/api/auth/forget-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resendResetOtp(email: string): Promise<{ message: string }> {
  return request("/api/auth/resend-reset-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(dto: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}
