import { ApiError, createApiClient, parseJsonSafely } from "@ajoti/shared";

export { ApiError, parseJsonSafely };

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const client = createApiClient({
  baseUrl: BASE_URL,
  storagePrefix: "",
  sessionExpiredRedirect: "/login",
  extraSessionKeys: [
    "kyc_completed",
    "verify_email",
    "reset_email",
    "pending_redirect",
  ],
});

export const { request, authRequest } = client;
