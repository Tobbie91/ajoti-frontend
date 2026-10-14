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
  status?: "PENDING" | "SUCCESS" | "FAILED" | "STOPPED";
  startDate?: string;
  endDate?: string;
  minAmountKobo?: string;
  maxAmountKobo?: string;
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
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return fetch(`${BASE_URL}/api/superadmin/export?${q}`, {
    credentials: "include",
  }).then((r) => r.blob());
}

// ── Wallets (customer wallets only - system accounts have their own page) ─────

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

// ── System Accounts (Financial Architecture Phase 1) - ownerless platform accounts ─

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

export interface FinanceDateWindow {
  startDate: string;
  endDate: string;
  asOf?: string;
}

export interface AcquisitionSourceRow {
  id: string;
  name: string;
  trackingCode: string;
  isActive: boolean;
}

export interface FinanceExpenseCategoryRow {
  id: string;
  name: string;
  isActive: boolean;
}

export interface FinanceExpenseRow {
  id: string;
  amountKobo: string;
  incurredAt: string;
  description: string;
  paymentMethod: string;
  externalReference: string | null;
  categoryId: string;
  category: { id: string; name: string };
  sourceId: string | null;
  source: { id: string; name: string; trackingCode: string } | null;
  createdAt: string;
  voidedAt: string | null;
  voidReason: string | null;
}

export interface CampaignCacRow {
  sourceId: string;
  sourceName: string;
  trackingCode: string | null;
  isActive: boolean;
  spendKobo: string;
  registrations: number;
  verifiedRegistrations: number;
  registrationCacKobo: string | null;
  verifiedCacKobo: string | null;
}

export interface FinanceReport {
  startDate: string;
  endDate: string;
  asOf: string;
  platformRevenueCreditsKobo: string;
  platformRevenueDebitsKobo: string;
  platformRevenueNetKobo: string;
  reportedExpensesKobo: string;
  operatingResultKobo: string;
  expensesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    amountKobo: string;
  }>;
  campaigns: CampaignCacRow[];
  unattributedRegistrations: number;
  unattributedVerifiedRegistrations: number;
}

export async function getFinanceReport(
  params: FinanceDateWindow,
): Promise<FinanceReport> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== "",
      ),
    ) as Record<string, string>,
  ).toString();
  const res = await authRequest<{ success: boolean; data: FinanceReport }>(
    `/api/superadmin/finance/reports?${q}`,
    { method: "GET" },
  );
  return res.data;
}

export async function listFinanceExpenses(
  params: FinanceDateWindow,
): Promise<FinanceExpenseRow[]> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== "",
      ),
    ) as Record<string, string>,
  ).toString();
  const res = await authRequest<{
    success: boolean;
    data: FinanceExpenseRow[];
  }>(`/api/superadmin/finance/expenses?${q}`, { method: "GET" });
  return res.data;
}

export async function listAcquisitionSources(): Promise<
  AcquisitionSourceRow[]
> {
  const res = await authRequest<{
    success: boolean;
    data: AcquisitionSourceRow[];
  }>("/api/superadmin/finance/sources", { method: "GET" });
  return res.data;
}

export async function createAcquisitionSource(input: {
  name: string;
  trackingCode: string;
}) {
  const res = await authRequest<{
    success: boolean;
    data: AcquisitionSourceRow;
  }>("/api/superadmin/finance/sources", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deactivateAcquisitionSource(
  sourceId: string,
  reason: string,
) {
  const res = await authRequest<{
    success: boolean;
    data: AcquisitionSourceRow;
  }>(`/api/superadmin/finance/sources/${sourceId}/deactivate`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return res.data;
}

export async function listFinanceExpenseCategories(): Promise<
  FinanceExpenseCategoryRow[]
> {
  const res = await authRequest<{
    success: boolean;
    data: FinanceExpenseCategoryRow[];
  }>("/api/superadmin/finance/expense-categories", { method: "GET" });
  return res.data;
}

export async function createFinanceExpenseCategory(input: { name: string }) {
  const res = await authRequest<{
    success: boolean;
    data: FinanceExpenseCategoryRow;
  }>("/api/superadmin/finance/expense-categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deactivateFinanceExpenseCategory(
  categoryId: string,
  reason: string,
) {
  const res = await authRequest<{
    success: boolean;
    data: FinanceExpenseCategoryRow;
  }>(`/api/superadmin/finance/expense-categories/${categoryId}/deactivate`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return res.data;
}

export async function createFinanceExpense(input: {
  amountKobo: string;
  incurredAt: string;
  description: string;
  paymentMethod: string;
  externalReference?: string;
  categoryId: string;
  sourceId?: string;
}) {
  const res = await authRequest<{ success: boolean; data: FinanceExpenseRow }>(
    "/api/superadmin/finance/expenses",
    { method: "POST", body: JSON.stringify(input) },
  );
  return res.data;
}

export async function voidFinanceExpense(expenseId: string, reason: string) {
  const res = await authRequest<{ success: boolean; data: FinanceExpenseRow }>(
    `/api/superadmin/finance/expenses/${expenseId}/void`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
  return res.data;
}

// ── Payout Fee Settings - SYSTEM_CONFIG (SUPERADMIN only) ──────────────────────

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

// ── Loan Settings - SYSTEM_CONFIG (SUPERADMIN only) ─────────────────────────────

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

// ── Circle rules settings - SYSTEM_CONFIG (superadmin) ──────────────────────────
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

// ── Loans (early payouts) - VIEW_SYSTEM_ACCOUNTS (COMPLIANCE+) ──────────────────
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
  ledgerActivity: LoanLedgerActivity[];
  matchingPayout: {
    id: string;
    amount: string;
    status: "COMPLETED";
    cycleNumber: number;
    processedAt: string | null;
    ledgerActivity: LoanLedgerActivity[];
  } | null;
}

export interface LoanLedgerActivity {
  id: string;
  label: string;
  entryType: "CREDIT" | "DEBIT" | "RESERVE" | "RELEASE";
  account: string;
  amount: string;
  occurredAt: string;
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

// ── Debts - Super Admin ─────────────────────────────────────────────────────────
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
