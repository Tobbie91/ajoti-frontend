import {
  ApiError,
  BASE_URL,
  authRequest,
  parseJsonSafely,
  request,
} from "./client";
import type { PaginatedResponse } from "./users";

// ── Ledger & Audit ────────────────────────────────────────────────────────────

export interface LedgerRow {
  id: string;
  entryType: string;
  movementType: string;
  sourceType: string;
  amount: string;
  balanceAfter: string;
  reference: string;
  metadata: unknown;
  createdAt: string;
  wallet?: { user?: { firstName: string; lastName: string; email: string } };
}

export function getLedger(params: {
  page?: number;
  limit?: number;
  userId?: string;
  walletId?: string;
  reference?: string;
  sourceType?: string;
  from?: string;
  to?: string;
}): Promise<PaginatedResponse<LedgerRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/superadmin/ledger?${q}`, { method: "GET" });
}

export interface AuditLogRow {
  id: string;
  actorId: string;
  actorLabel: string | null;
  actorType: string;
  action: string;
  entityType: string;
  entityId: string;
  reason: string | null;
  metadata: unknown;
  createdAt: string;
}

export function getAuditLogs(params: {
  page?: number;
  limit?: number;
  actorId?: string;
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
}): Promise<PaginatedResponse<AuditLogRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/superadmin/audit-logs?${q}`, { method: "GET" });
}

export function exportCsv(params: {
  type: "transactions" | "users" | "ledger" | "circles";
  startDate: string;
  endDate: string;
}): Promise<Blob> {
  const token = localStorage.getItem("superadmin_access_token");
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return fetch(`${BASE_URL}/api/superadmin/export?${q}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((r) => r.blob());
}

// ── Wallets (customer wallets only — system accounts have their own page) ─────

export interface WalletRow {
  walletId: string;
  userId: string;
  status: string;
  currency: string;
  createdAt: string;
  balanceKobo: string;
  balanceNaira: string;
  lastActivityAt: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

// ── System Accounts (Financial Architecture Phase 1) — ownerless platform accounts ─

export type SystemAccountType =
  | "PLATFORM_POOL"
  | "PLATFORM_REVENUE"
  | "LOAN_FLOAT";

export interface SystemAccountRow {
  type: SystemAccountType;
  walletId: string;
  status: string;
  createdAt: string;
  balanceKobo: string;
  balanceNaira: string;
}

export function listSystemAccounts(): Promise<{
  success: boolean;
  data: SystemAccountRow[];
}> {
  return authRequest<{ success: boolean; data: SystemAccountRow[] }>(
    "/api/superadmin/finance/system-accounts",
    { method: "GET" },
  );
}

export interface CapitalizeResult {
  capitalizationId: string;
  amountKobo: string;
  floatBalanceKobo: string;
}

export function capitalizeLoanFloat(
  amountKobo: number,
  note: string,
): Promise<{ success: boolean; data: CapitalizeResult }> {
  return authRequest<{ success: boolean; data: CapitalizeResult }>(
    "/api/superadmin/finance/loan-float/capitalize",
    { method: "POST", body: JSON.stringify({ amountKobo, note }) },
  );
}

// ── Payout Fee Settings — SYSTEM_CONFIG (SUPERADMIN only) ──────────────────────

export interface PayoutFeeSettingMeta {
  updatedBy: string | null;
  updatedByLabel: string | null;
  updatedAt: string;
}

export interface PayoutFeeSettings {
  flatFeeKobo: number;
  adminShareKobo: number;
  platformShareKobo: number;
  minimumFloorKobo: number;
  meta: {
    flatFeeKobo: PayoutFeeSettingMeta;
    adminShareKobo: PayoutFeeSettingMeta;
    platformShareKobo: PayoutFeeSettingMeta;
    minimumFloorKobo: PayoutFeeSettingMeta;
  };
}

export interface PayoutFeeSettingsInput {
  flatFeeKobo: number;
  adminShareKobo: number;
  platformShareKobo: number;
  minimumFloorKobo: number;
}

export function getPayoutFeeSettings(): Promise<{
  success: boolean;
  data: PayoutFeeSettings;
}> {
  return authRequest<{ success: boolean; data: PayoutFeeSettings }>(
    "/api/superadmin/settings/payout-fee",
    { method: "GET" },
  );
}

export function updatePayoutFeeSettings(
  input: PayoutFeeSettingsInput,
): Promise<{ success: boolean; data: PayoutFeeSettings }> {
  return authRequest<{ success: boolean; data: PayoutFeeSettings }>(
    "/api/superadmin/settings/payout-fee",
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

// ── Loan Settings — SYSTEM_CONFIG (SUPERADMIN only) ─────────────────────────────

export interface LoanSettingMeta {
  updatedBy: string | null;
  updatedByLabel: string | null;
  updatedAt: string;
}

export interface LoanSettings {
  maxPayoutRatioBps: number;
  minCompletedCycles: number;
  maxLatePayments: number;
  meta: {
    maxPayoutRatioBps: LoanSettingMeta;
    minCompletedCycles: LoanSettingMeta;
    maxLatePayments: LoanSettingMeta;
  };
}

export interface LoanSettingsInput {
  maxPayoutRatioBps: number;
  minCompletedCycles: number;
  maxLatePayments: number;
}

export function getLoanSettings(): Promise<{
  success: boolean;
  data: LoanSettings;
}> {
  return authRequest<{ success: boolean; data: LoanSettings }>(
    "/api/superadmin/settings/loan",
    { method: "GET" },
  );
}

export function updateLoanSettings(
  input: LoanSettingsInput,
): Promise<{ success: boolean; data: LoanSettings }> {
  return authRequest<{ success: boolean; data: LoanSettings }>(
    "/api/superadmin/settings/loan",
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

// ── Circle rules settings — SYSTEM_CONFIG (superadmin) ──────────────────────────
export interface CircleRuleSettingMeta {
  updatedBy: string | null;
  updatedByLabel: string | null;
  updatedAt: string;
}

export interface CircleRulesSettings {
  collateralRatioBps: number;
  latePenaltyRatioBps: number;
  minTrustScore: number;
  postStartExitPenaltyBps: number;
  meta: {
    collateralRatioBps: CircleRuleSettingMeta;
    latePenaltyRatioBps: CircleRuleSettingMeta;
    minTrustScore: CircleRuleSettingMeta;
    postStartExitPenaltyBps: CircleRuleSettingMeta;
  };
}

export interface CircleRulesSettingsInput {
  collateralRatioBps: number;
  latePenaltyRatioBps: number;
  minTrustScore: number;
  postStartExitPenaltyBps: number;
}

export function getCircleRulesSettings(): Promise<{
  success: boolean;
  data: CircleRulesSettings;
}> {
  return authRequest<{ success: boolean; data: CircleRulesSettings }>(
    "/api/superadmin/settings/circle-rules",
    { method: "GET" },
  );
}

export function updateCircleRulesSettings(
  input: CircleRulesSettingsInput,
): Promise<{ success: boolean; data: CircleRulesSettings }> {
  return authRequest<{ success: boolean; data: CircleRulesSettings }>(
    "/api/superadmin/settings/circle-rules",
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

// ── Loans (early payouts) — VIEW_SYSTEM_ACCOUNTS (COMPLIANCE+) ──────────────────
// Read-only oversight: list + detail, no write-off/cancel/force-repay actions.

export type LoanStatus = "ACTIVE" | "REPAID" | "DEFAULTED" | "CANCELLED";

export interface LoanRow {
  id: string;
  userId: string;
  circleId: string;
  payoutAmount: string;
  loanAmount: string;
  companyFee: string;
  finalPayout: string;
  grossAmount: string;
  creditScoreUsed: number;
  allowedPercent: number;
  status: LoanStatus;
  createdAt: string;
  repaidAt: string | null;
  stranded: boolean;
  user: { firstName: string; lastName: string; email: string };
  circle: { name: string };
}

export interface LoanDetail extends LoanRow {
  circle: { name: string; status: string };
}

export function getLoans(
  params: {
    page?: number;
    limit?: number;
    status?: LoanStatus;
    circleId?: string;
    startDate?: string;
    endDate?: string;
    stranded?: boolean;
  } = {},
): Promise<PaginatedResponse<LoanRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/superadmin/loans${q ? `?${q}` : ""}`, {
    method: "GET",
  });
}

export async function getLoanDetail(loanId: string): Promise<LoanDetail> {
  const res = await authRequest<{ success: boolean; data: LoanDetail }>(
    `/api/superadmin/loans/${loanId}`,
    { method: "GET" },
  );
  return res.data;
}

// ── Debts — Super Admin ─────────────────────────────────────────────────────────
// Read-only oversight: list + detail, no write actions (repayment is member-only).

export type DebtStatus = "OUTSTANDING" | "PARTIALLY_REPAID" | "SETTLED";
export type DebtCategory = "MISSED_CONTRIBUTION" | "LATE_PENALTY" | "MIXED";

export interface DebtRow {
  id: string;
  circleId: string;
  circleName?: string;
  cycleNumber: number;
  status: DebtStatus;
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
  user: { firstName: string; lastName: string; email: string };
}

export interface DebtDetail extends DebtRow {
  circleStatus?: string;
}

export function getDebts(
  params: {
    page?: number;
    limit?: number;
    status?: DebtStatus;
    userId?: string;
    circleId?: string;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<PaginatedResponse<DebtRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/superadmin/debts${q ? `?${q}` : ""}`, {
    method: "GET",
  });
}

export async function getDebtDetail(debtId: string): Promise<DebtDetail> {
  const res = await authRequest<{ success: boolean; data: DebtDetail }>(
    `/api/superadmin/debts/${debtId}`,
    { method: "GET" },
  );
  return res.data;
}

export function listWallets(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResponse<WalletRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/superadmin/analytics/wallets?${q}`, {
    method: "GET",
  });
}
