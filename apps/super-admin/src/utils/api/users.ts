import {
  ApiError,
  BASE_URL,
  authRequest,
  parseJsonSafely,
  request,
} from "./client";

// ── Users ─────────────────────────────────────────────────────────────────────

export interface SuperadminUserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  suspendedAt: string | null;
  suspensionReason: string | null;
  adminRequestedAt: string | null;
  kyc: { status: string; step: string } | null;
  wallet: { id: string; status: string } | null;
  _count: { roscaMemberships: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function listUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  kycStatus?: string;
  registeredFrom?: string;
  registeredTo?: string;
  pendingAdminRequest?: boolean;
}): Promise<PaginatedResponse<SuperadminUserRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/superadmin/users?${q}`, { method: "GET" });
}

export interface SuperadminUserDetail {
  user: Record<string, unknown>;
  wallet: {
    id: string;
    status: string;
    balanceKobo: string;
    balanceNaira: string;
  } | null;
  roscaParticipation: unknown[];
  recentActivity: unknown[];
  outstandingDebts: unknown[];
}

export function getUserDetail(userId: string): Promise<SuperadminUserDetail> {
  return authRequest(`/api/superadmin/users/${userId}`, { method: "GET" });
}

export function updateUserStatus(
  userId: string,
  status: "ACTIVE" | "SUSPENDED" | "BANNED",
  reason?: string,
): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
}

// Distinct from updateUserStatus — only valid on FROZEN accounts, and is the final step
// after identity verification has already happened outside the app. Not a generic
// reactivate; the backend rejects lifting a freeze via updateUserStatus entirely.
export function unfreezeAccount(
  userId: string,
): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/users/${userId}/unfreeze`, {
    method: "PATCH",
  });
}

export function approveAdminRequest(
  userId: string,
): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/users/${userId}/approve-admin`, {
    method: "PATCH",
  });
}

export function rejectAdminRequest(
  userId: string,
): Promise<{ success: boolean; data: unknown }> {
  return authRequest(`/api/superadmin/users/${userId}/reject-admin`, {
    method: "PATCH",
  });
}

// ── KYC ───────────────────────────────────────────────────────────────────────

export interface KycQueueRow {
  id: string;
  userId: string;
  status: string;
  step: string;
  kycLevel: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  ninVerifiedAt: string | null;
  bvnVerifiedAt: string | null;
  nextOfKinName: string | null;
  nextOfKinRelationship: string | null;
  nextOfKinPhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  lga: string | null;
  country: string | null;
  verificationData: Record<string, unknown> | null;
  providerStatus: string | null;
  approvalSource: "SYSTEM_AUTO" | "SUPERADMIN" | "LEGACY_MANUAL" | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    gender: string | null;
    dob: string | null;
    isVerified: boolean;
    status: string;
    createdAt: string;
  };
}

export function listKycQueue(params: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<KycQueueRow>> {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined),
    ) as Record<string, string>,
  ).toString();
  return authRequest(`/api/superadmin/kyc?${q}`, { method: "GET" });
}

export function getKycDetail(userId: string): Promise<Record<string, unknown>> {
  return authRequest(`/api/superadmin/kyc/${userId}`, { method: "GET" });
}

export function approveKyc(userId: string): Promise<unknown> {
  return authRequest(`/api/superadmin/kyc/approve/${userId}`, {
    method: "PATCH",
  });
}

export function rejectKyc(
  userId: string,
  rejectionReason: string,
): Promise<unknown> {
  return authRequest(`/api/superadmin/kyc/reject/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ rejectionReason }),
  });
}

export function overrideKycLevel(
  userId: string,
  kycLevel: number,
): Promise<unknown> {
  return authRequest(`/api/superadmin/kyc/override/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ kycLevel }),
  });
}

export function getProviderIdentity(
  userId: string,
): Promise<Record<string, unknown>> {
  return authRequest(`/api/superadmin/kyc/identity/${userId}`, {});
}
