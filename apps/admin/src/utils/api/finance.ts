import {
  ApiError,
  BASE_URL,
  authRequest,
  parseJsonSafely,
  request,
} from "./client";

// ── Wallet Transactions ───────────────────────────────────────────────────────

export interface WalletTransaction {
  id: string;
  entryType: string;
  movementType: string;
  bucketType: string | null;
  amount: string | number;
  balanceBefore?: string | number;
  balanceAfter?: string | number;
  createdAt: string;
  metadata?: Record<string, unknown>;
  sourceType?: string;
  type?: string;
  description?: string;
  [key: string]: unknown;
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  const res = await authRequest<
    { data?: WalletTransaction[] } | WalletTransaction[]
  >("/api/wallet/transactions", { method: "GET" });
  return Array.isArray(res)
    ? res
    : ((res as { data?: WalletTransaction[] }).data ?? []);
}

// ── Admin Wallet ─────────────────────────────────────────────────────────────

export interface AdminWalletBalance {
  total: number;
  reserved: number;
  available: number;
  currency: string;
}

export async function getAdminWalletBalance(
  userId: string,
): Promise<AdminWalletBalance> {
  const res = await authRequest<
    { data?: AdminWalletBalance } | AdminWalletBalance
  >(`/api/admin/wallet/user/${userId}`, { method: "GET" });
  return ("data" in res && res.data ? res.data : res) as AdminWalletBalance;
}

export interface WalletBalance {
  total: string;
  reserved: string;
  available: string;
  currency: string;
}

export async function getWalletBalance(): Promise<WalletBalance> {
  const res = await authRequest<{ data?: WalletBalance } | WalletBalance>(
    "/api/wallet/balance",
    { method: "GET" },
  );
  return ("data" in res && res.data ? res.data : res) as WalletBalance;
}

// ── Virtual Account ───────────────────────────────────────────────────────────

export interface VirtualAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  accountName: string;
  currency: string;
  isActive: boolean;
  [key: string]: unknown;
}

export async function getVirtualAccount(): Promise<VirtualAccount> {
  const res = await authRequest<{ data?: VirtualAccount } | VirtualAccount>(
    "/api/wallet/virtual-account",
    { method: "GET" },
  );
  return ("data" in res && res.data ? res.data : res) as VirtualAccount;
}

// ── Wallet Funding ────────────────────────────────────────────────────────────

export interface FundingInitResponse {
  authorizationUrl?: string;
  paymentLink?: string;
  paymentUrl?: string;
  link?: string;
  reference?: string;
  [key: string]: unknown;
}

export async function initializeFunding(payload: {
  amount: number;
  redirectUrl: string;
  currency?: string;
}): Promise<FundingInitResponse> {
  const res = await authRequest<
    { data?: FundingInitResponse } | FundingInitResponse
  >("/api/wallet/funding/initialize", {
    method: "POST",
    body: JSON.stringify({ currency: "NGN", ...payload }),
  });
  return ("data" in res && res.data ? res.data : res) as FundingInitResponse;
}

export function verifyFunding(
  reference: string,
): Promise<Record<string, unknown>> {
  return authRequest(`/api/wallet/funding/verify/${reference}`, {
    method: "GET",
  });
}

// ── Withdrawal ────────────────────────────────────────────────────────────────

export interface WithdrawalPayload {
  amount: number; // naira - will be multiplied × 100 to kobo before sending
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName?: string;
  narration?: string;
  transactionPin: string;
}

export async function initializeWithdrawal(
  payload: WithdrawalPayload,
): Promise<Record<string, unknown>> {
  const { amount, ...rest } = payload;
  const res = await authRequest<
    { data?: Record<string, unknown> } | Record<string, unknown>
  >(
    "/api/wallet/withdrawal/initialize",
    { method: "POST", body: JSON.stringify({ ...rest, amount: amount * 100 }) }, // convert naira → kobo
  );
  return ("data" in res && res.data ? res.data : res) as Record<
    string,
    unknown
  >;
}

// ── Saved Bank Accounts ───────────────────────────────────────────────────────

export interface BankOption {
  id: number;
  code: string;
  name: string;
}

export async function getBanks(): Promise<BankOption[]> {
  const res = await authRequest<{ data: BankOption[] }>(
    "/api/wallet/withdrawal/banks",
    { method: "GET" },
  );
  return res.data ?? [];
}

export async function resolveAccount(
  accountNumber: string,
  bankCode: string,
): Promise<{ accountNumber: string; accountName: string }> {
  const res = await authRequest<{
    data: { accountNumber: string; accountName: string };
  }>("/api/wallet/withdrawal/resolve-account", {
    method: "POST",
    body: JSON.stringify({ accountNumber, bankCode }),
  });
  return res.data;
}

export interface SavedBankAccount {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  createdAt: string;
}

export function listBankAccounts(): Promise<{ data: SavedBankAccount[] }> {
  return authRequest("/api/users/me/bank-accounts", { method: "GET" });
}

export function addBankAccount(
  bankCode: string,
  bankName: string,
  accountNumber: string,
  transactionPin: string,
): Promise<{ data: SavedBankAccount }> {
  return authRequest("/api/users/me/bank-accounts", {
    method: "POST",
    body: JSON.stringify({ bankCode, bankName, accountNumber, transactionPin }),
  });
}

export function removeBankAccount(
  id: string,
): Promise<{ data: { deleted: boolean } }> {
  return authRequest(`/api/users/me/bank-accounts/${id}`, { method: "DELETE" });
}

export function setDefaultBankAccount(
  id: string,
): Promise<{ data: { updated: boolean } }> {
  return authRequest(`/api/users/me/bank-accounts/${id}/set-default`, {
    method: "PATCH",
  });
}

// ── Transaction PIN ───────────────────────────────────────────────────────────

export function setTransactionPin(
  pin: string,
  currentPin?: string,
): Promise<{ message: string }> {
  return authRequest("/api/users/me/pin", {
    method: "POST",
    body: JSON.stringify({ pin, ...(currentPin ? { currentPin } : {}) }),
  });
}

export function getPinStatus(): Promise<{ hasPin: boolean }> {
  return authRequest("/api/users/me/pin/status", { method: "GET" });
}

// ── Trust Score ───────────────────────────────────────────────────────────────

export interface ATIBreakdown {
  recentBehavior: number;
  historyBehavior: number;
  payoutReliability: number;
  peerScore: number;
  historyLength: number;
  weights: {
    recentBehavior: number;
    historyBehavior: number;
    payoutReliability: number;
    peerScore: number;
    historyLength: number;
  };
}

export interface TrustScore {
  trustScore: number;
  displayScore?: number;
  atiBreakdown?: ATIBreakdown | null;
  [key: string]: unknown;
}

export async function getTrustScore(): Promise<TrustScore> {
  const res = await authRequest<{ data?: TrustScore } | TrustScore>(
    "/api/trust/my-score",
    { method: "GET" },
  );
  return ("data" in res && res.data ? res.data : res) as TrustScore;
}

// ── Loans ─────────────────────────────────────────────────────────────────────

export interface LoanEligibility {
  eligible: boolean;
  reason?: string;
  ineligibilityReason?: string;
  finalCreditScore?: number;
  allowedPercent?: number;
  expectedPayoutAmount?: string;
  grossLoanAmount?: string;
  companyFee?: string;
  maxLoanAmount?: string;
  [key: string]: unknown;
}

export async function getLoanEligibility(
  circleId: string,
): Promise<LoanEligibility> {
  const res = await authRequest<{ data?: LoanEligibility } | LoanEligibility>(
    `/api/loan/eligibility?circleId=${circleId}`,
    { method: "GET" },
  );
  return ("data" in res && res.data ? res.data : res) as LoanEligibility;
}

export interface Loan {
  id: string;
  circleId: string;
  circleName?: string;
  payoutAmount: number | string;
  loanAmount: number | string;
  companyFee: number | string;
  finalPayout: number | string;
  status: string;
  createdAt: string;
  repaidAt?: string | null;
  [key: string]: unknown;
}

export async function applyForLoan(payload: {
  circleId: string;
}): Promise<Loan> {
  const res = await authRequest<{ data?: Loan } | Loan>("/api/loan/apply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return ("data" in res && res.data ? res.data : res) as Loan;
}

export async function getLoanStatus(): Promise<Loan | null> {
  const res = await authRequest<{ data?: Loan | null } | Loan>("/api/loan/status", {
    method: "GET",
  });
  if ("data" in res) return (res as { data?: Loan | null }).data ?? null;
  return res as Loan;
}

export async function getLoanHistory(): Promise<Loan[]> {
  const res = await authRequest<{ data?: Loan[] } | Loan[]>(
    "/api/loan/history",
    { method: "GET" },
  );
  return Array.isArray(res) ? res : ((res as { data?: Loan[] }).data ?? []);
}

// ── Credit Score ──────────────────────────────────────────────────────────────

export interface CreditScore {
  score: number;
  compositeScore?: number;
  tier?: string;
  [key: string]: unknown;
}

export async function getCreditScore(): Promise<CreditScore> {
  const res = await authRequest<{ data?: CreditScore } | CreditScore>(
    "/api/credit-score",
    { method: "GET" },
  );
  return ("data" in res && res.data ? res.data : res) as CreditScore;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  [key: string]: unknown;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const res = await authRequest<{ data?: unknown[] } | unknown[]>(
    "/api/notifications",
    { method: "GET" },
  );
  const raw: unknown[] = Array.isArray(res)
    ? res
    : ((res as { data?: unknown[] }).data ?? []);
  return raw.map((n: unknown) => {
    const r = n as Record<string, unknown>;
    return {
      ...r,
      message: (r.message ?? r.body ?? "") as string,
      read: (r.read ?? r.isRead ?? false) as boolean,
    } as AppNotification;
  });
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await authRequest<
    { count?: number; unreadCount?: number } | number
  >("/api/notifications/unread-count", { method: "GET" });
  if (typeof res === "number") return res;
  return (
    (res as { count?: number; unreadCount?: number }).count ??
    (res as { count?: number; unreadCount?: number }).unreadCount ??
    0
  );
}

export function markNotificationRead(id: string): Promise<{ message: string }> {
  return authRequest(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead(): Promise<{ message: string }> {
  return authRequest("/api/notifications/read-all", { method: "PATCH" });
}
