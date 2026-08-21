import { ApiError, createApiClient, parseJsonSafely } from "@ajoti/shared";

export { ApiError, parseJsonSafely };

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const client = createApiClient({
  baseUrl: BASE_URL,
  storagePrefix: "superadmin_",
  sessionExpiredRedirect: "/login",
});

export const { request, authRequest } = client;

export function clearSessionAndRedirect() {
  client.clearSessionAndRedirect();
}
