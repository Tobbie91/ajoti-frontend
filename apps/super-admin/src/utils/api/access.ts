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

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{
  token: string;
  refreshToken: string;
  user: SuperadminUser;
  mustChangePassword: boolean;
}> {
  const res = await fetch(`${BASE_URL}/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

  const raw = data as Record<string, unknown>;
  const payload = (raw.data ?? raw) as Record<string, unknown>;

  const token = (payload.accessToken ?? payload.token ?? "") as string;
  const refreshToken = (payload.refreshToken ?? "") as string;

  // Role and sub are in the JWT payload - backend doesn't return a user object
  const jwtPayload = decodeJwtPayload(token);

  const user: SuperadminUser = {
    id: (jwtPayload.sub ?? "") as string,
    email,
    firstName: (jwtPayload.firstName ?? "") as string,
    lastName: (jwtPayload.lastName ?? "") as string,
    role: (jwtPayload.role ?? "") as string,
    staffRole: (jwtPayload.staffRole ?? null) as string | null,
  };

  return {
    token,
    refreshToken,
    user,
    mustChangePassword: Boolean(payload.mustChangePassword),
  };
}

export function logoutApi(refreshToken: string): Promise<{ message: string }> {
  return authRequest("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
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
