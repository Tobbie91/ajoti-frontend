import {
  ApiError,
  BASE_URL,
  authRequest,
  parseJsonSafely,
  request,
} from "./client";

// ── Auth ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  dob: string; // "YYYY-MM-DD"
  gender: "MALE" | "FEMALE";
  phone: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  userId?: string;
}

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Login
export interface LoginResponse {
  user: {
    email: string;
    firstname: string;
    lastname: string;
    DOB: string;
    phone: string;
  };
  accessToken: string;
  refreshToken: string;
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; refreshToken: string; user: UserProfile }> {
  const res = await fetch(`${BASE_URL}/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      email,
      password,
    }),
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

  const token = (payload.accessToken ??
    payload.token ??
    payload.access_token ??
    "") as string;
  const refreshToken = (payload.refreshToken ??
    payload.refresh_token ??
    "") as string;
  const backendUser = (payload.user ?? payload.profile ?? {}) as Record<
    string,
    unknown
  >;

  const user: UserProfile = {
    id: (backendUser.id ?? backendUser._id ?? "") as string,
    email: (backendUser.email ?? email) as string,
    firstName: (backendUser.firstName ?? backendUser.firstname ?? "") as string,
    lastName: (backendUser.lastName ?? backendUser.lastname ?? "") as string,
    dob: backendUser.DOB
      ? (backendUser.DOB as string).split("T")[0]
      : ((backendUser.dob as string) ?? ""),
    phone: (backendUser.phone ?? "") as string,
  };

  return { token, refreshToken, user };
}

// Verify email OTP
export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export function verifyEmail(
  payload: VerifyEmailPayload,
): Promise<{ message: string }> {
  return request("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Resend OTP
export function resendOtp(email: string): Promise<{ message: string }> {
  return request("/api/auth/resend-verify-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// ── KYC ─────────────────────────────────────────────────────────────────────

export interface KycStatus {
  ninVerified: boolean;
  bvnVerified: boolean;
  nokSubmitted: boolean;
  status: string; // "PENDING" | "APPROVED" | "REJECTED"
  step?: string;
  kycLevel: number; // 0 = none, 1 = NIN+BVN+NOK, 2 = +GovID, 3 = +ProofOfAddress
  rejectionReason?: string | null;
  verificationData?: Record<string, unknown> | null;
  address?: string;
  city?: string;
  state?: string;
  lga?: string;
}

export function getKycStatus(): Promise<KycStatus> {
  return authRequest("/api/kyc/status", { method: "GET" });
}

export function resubmitKyc(): Promise<KycStatus> {
  return authRequest("/api/kyc/resubmit", { method: "POST" });
}

export interface ProveInitiatePayload {
  nin?: string;
  bvn?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export function proveInitiate(
  payload: ProveInitiatePayload,
): Promise<{ monoUrl: string | null; reference: string }> {
  return authRequest("/api/kyc/prove/initiate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface SubmitNokPayload {
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinPhone: string;
}

export function submitNok(
  payload: SubmitNokPayload,
): Promise<{ message: string }> {
  return authRequest("/api/kyc/submit-nok", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dob?: string;
  address?: string;
  city?: string;
  state?: string;
  lga?: string;
  role?: string;
  status?: "ACTIVE" | "SUSPENDED" | "BANNED" | "FROZEN";
  [key: string]: unknown;
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await authRequest<{ data?: UserProfile } | UserProfile>(
    "/api/users/me",
    { method: "GET" },
  );
  return ("data" in res && res.data ? res.data : res) as UserProfile;
}

export function updateUserProfile(
  payload: Partial<UserProfile>,
): Promise<{ message: string; data?: UserProfile }> {
  return authRequest("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function verifyPendingEmailChange(
  otp: string,
): Promise<{ message: string; data?: UserProfile }> {
  return authRequest("/api/users/me/email/verify", {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

// ── KYC Admin ────────────────────────────────────────────────────────────────

export interface PendingKycRecord {
  userId: string;
  name: string;
  email: string;
  submittedAt: string | null;
  ninVerifiedAt: string | null;
  bvnVerifiedAt: string | null;
  nokSubmitted: boolean;
}

export function listPendingKyc(): Promise<PendingKycRecord[]> {
  return authRequest("/api/kyc/pending", { method: "GET" });
}

export function approveKyc(userId: string): Promise<KycStatus> {
  return authRequest(`/api/kyc/approve/${userId}`, { method: "PATCH" });
}

export function rejectKyc(
  userId: string,
  rejectionReason: string,
): Promise<KycStatus> {
  return authRequest(`/api/kyc/reject/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ rejectionReason }),
  });
}

// ── Logout ──────────────────────────────────────────────────────────────────

export function logout(refreshToken: string): Promise<{ message: string }> {
  return authRequest("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function deleteMyAccount(
  currentPassword: string,
  reason?: string,
): Promise<{ message: string }> {
  return authRequest("/api/users/me", {
    method: "DELETE",
    body: JSON.stringify({ currentPassword, confirm: "DELETE", reason }),
  });
}

export function freezeMyAccount(
  currentPassword: string,
  reason?: string,
): Promise<{ message: string; ticketId: string }> {
  return authRequest("/api/users/me/freeze", {
    method: "POST",
    body: JSON.stringify({ currentPassword, reason }),
  });
}

// ── Password ────────────────────────────────────────────────────────────────

export function forgotPassword(email: string): Promise<{ message: string }> {
  return request("/api/auth/forget-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(payload: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
