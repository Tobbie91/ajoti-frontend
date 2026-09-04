import {
  ApiError,
  BASE_URL,
  authRequest,
  parseJsonSafely,
  request,
} from "./client";

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface SuperadminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  staffRole: string | null;
}

export async function login(
  email: string,
  password: string,
): Promise<{
  user: SuperadminUser;
  mustChangePassword: boolean;
}> {
  const res = await fetch(`${BASE_URL}/api/auth/token`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Scope": "staff",
    },
    body: new URLSearchParams({ grant_type: "password", email, password }),
  });

  const data = await parseJsonSafely(res);

  if (!res.ok) {
    const msg = (data as { message?: string | string[] }).message;
    throw new ApiError(
      Array.isArray(msg) ? msg[0] : (msg ?? "Invalid email or password"),
      res.status,
    );
  }

  const payload = data as { mustChangePassword?: boolean };
  const user = await getCurrentUser();

  return {
    user,
    mustChangePassword: Boolean(payload.mustChangePassword),
  };
}

export function logoutApi(): Promise<{ message: string }> {
  return authRequest("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getCurrentUser(): Promise<SuperadminUser> {
  const response = await authRequest<{ data?: SuperadminUser } | SuperadminUser>(
    "/api/users/me",
    { method: "GET" },
  );
  return ("data" in response && response.data ? response.data : response) as SuperadminUser;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    banned: number;
    newThisWeek: number;
  };
  circles: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    newThisWeek: number;
  };
  kyc: { pending: number; approved: number; rejected: number };
  wallet: {
    totalUserBalanceKobo: string;
    totalUserBalanceNaira: string;
    platformPoolKobo: string;
    platformPoolNaira: string;
    totalWallets: number;
  };
  defaulters: { outstandingDebts: number };
}

export function getDashboardStats(): Promise<DashboardStats> {
  return authRequest("/api/superadmin/analytics/dashboard", { method: "GET" });
}

export interface WalletSummary {
  totalUserBalanceKobo: string;
  totalUserBalanceNaira: string;
  platformPoolKobo: string;
  platformPoolNaira: string;
  walletCounts: { active: number; frozen: number; suspended: number };
}

export function getWalletSummary(): Promise<WalletSummary> {
  return authRequest("/api/superadmin/analytics/wallet", { method: "GET" });
}

export interface TransactionAnalytics {
  period: { start: string; end: string };
  inflow: {
    totalKobo: string;
    totalNaira: string;
    count: number;
    byDay: { date: string; amountKobo: string }[];
  };
  outflow: {
    totalKobo: string;
    totalNaira: string;
    count: number;
    byDay: { date: string; amountKobo: string }[];
  };
  platformFees: {
    totalKobo: string;
    totalNaira: string;
    count: number;
    byDay: { date: string; amountKobo: string }[];
  };
}

export function getTransactionAnalytics(params: {
  period?: "7d" | "30d" | "90d" | "custom";
  startDate?: string;
  endDate?: string;
}): Promise<TransactionAnalytics> {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return authRequest(`/api/superadmin/analytics/transactions?${q}`, {
    method: "GET",
  });
}

export interface GrowthMetrics {
  period: string;
  users: {
    current: number;
    previous: number;
    delta: number;
    percentChange: string | null;
  };
  circles: {
    current: number;
    previous: number;
    delta: number;
    percentChange: string | null;
  };
  timeSeries: {
    users: { date: string; count: number }[];
    circles: { date: string; count: number }[];
  };
}

export function getGrowthMetrics(params: {
  period?: "7d" | "30d" | "90d";
}): Promise<GrowthMetrics> {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return authRequest(`/api/superadmin/analytics/growth?${q}`, {
    method: "GET",
  });
}
