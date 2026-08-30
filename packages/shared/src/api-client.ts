// packages/shared/src/api-client.ts
//
// Factory for the fetch/refresh/session-expiry machinery that was
// byte-for-byte duplicated across the frontend apps' utils/api.ts files
// (differing only in localStorage key prefix and the redirect target on
// session expiry). Each app still owns its ~1000 lines of domain-specific
// endpoint functions - this only consolidates the infrastructure beneath them.

export class ApiError extends Error {
  readonly code?: number;
  readonly appCode?: string;
  readonly reference?: string;
  readonly messages: string[];
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    code?: number,
    metadata?: {
      appCode?: string;
      reference?: string;
      messages?: string[];
      fieldErrors?: Record<string, string[]>;
    },
  ) {
    super(message);
    this.code = code;
    this.appCode = metadata?.appCode;
    this.reference = metadata?.reference;
    this.messages = metadata?.messages ?? [message];
    this.fieldErrors = metadata?.fieldErrors ?? {};
    this.name = "ApiError";
  }
}

function apiErrorFromResponse(data: unknown, status: number): ApiError {
  const payload = data as {
    message?: string | string[];
    code?: string;
    reference?: string;
    fieldErrors?: Record<string, string | string[]>;
  };
  const messages = Array.isArray(payload.message)
    ? payload.message
    : [payload.message ?? "Something went wrong"];
  const fieldErrors = Object.fromEntries(
    Object.entries(payload.fieldErrors ?? {}).map(([field, value]) => [
      field,
      Array.isArray(value) ? value : [value],
    ]),
  );
  return new ApiError(messages.join(' '), status, {
    appCode: payload.code,
    reference: payload.reference,
    messages,
    fieldErrors,
  });
}

export interface ApiClientConfig {
  baseUrl: string;
  /** '' for the user app, 'admin_' / 'superadmin_' for the staff apps. */
  storagePrefix: string;
  /** Internal application path used when the session cannot be refreshed. */
  sessionExpiredRedirect: `/${string}`;
  /** Extra localStorage keys to clear on session expiry, beyond access/refresh/user. */
  extraSessionKeys?: string[];
}

export interface ApiClient {
  request<T>(path: string, options: RequestInit): Promise<T>;
  authRequest<T>(path: string, options: RequestInit): Promise<T>;
  getAccessToken(): string | null;
  getBaseUrl(): string;
  clearSessionAndRedirect(): void;
}

export function parseJsonSafely(res: Response): Promise<unknown> {
  return res.json().catch((e: unknown) => {
    if (import.meta.env.DEV)
      console.error("[api] Failed to parse response JSON:", e);
    return {};
  });
}

function safeInternalRedirect(target: `/${string}`): string {
  // Only same-origin absolute paths are valid. In particular, reject protocol-
  // relative URLs (//evil.example) even though they satisfy the TypeScript shape.
  return target.startsWith("//") ? "/login" : target;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const {
    baseUrl,
    storagePrefix,
    sessionExpiredRedirect,
    extraSessionKeys = [],
  } = config;
  const accessTokenKey = `${storagePrefix}access_token`;
  const refreshTokenKey = `${storagePrefix}refresh_token`;
  const userKey = `${storagePrefix}user`;

  async function request<T>(path: string, options: RequestInit): Promise<T> {
    const { headers, ...rest } = options;
    // FormData bodies (e.g. KYC document uploads) must not get a JSON
    // Content-Type - the browser needs to set its own multipart boundary.
    const isFormData = options.body instanceof FormData;
    const contentTypeHeader: Record<string, string> = isFormData
      ? {}
      : { "Content-Type": "application/json" };

    const res = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers: {
        ...contentTypeHeader,
        ...(headers as Record<string, string> | undefined),
      },
    });

    const data = await parseJsonSafely(res);

    if (res.status === 503 && (data as { maintenance?: boolean }).maintenance) {
      window.location.replace("/maintenance");
      throw new ApiError("Maintenance", 503);
    }

    if (!res.ok) {
      throw apiErrorFromResponse(data, res.status);
    }

    return data as T;
  }

  let isRefreshing = false;
  let refreshQueue: Array<(token: string) => void> = [];

  async function tryRefresh(): Promise<string> {
    const refreshToken = localStorage.getItem(refreshTokenKey);
    if (!refreshToken) throw new Error("No refresh token");

    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) throw new Error("Refresh failed");

    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    localStorage.setItem(accessTokenKey, data.accessToken);
    localStorage.setItem(refreshTokenKey, data.refreshToken);
    return data.accessToken;
  }

  function clearSessionAndRedirect(): void {
    [accessTokenKey, refreshTokenKey, userKey, ...extraSessionKeys].forEach(
      (k) => localStorage.removeItem(k),
    );
    const redirectTarget = safeInternalRedirect(sessionExpiredRedirect);
    // nosemgrep: ajoti-frontend-window-location-input -- redirectTarget is constrained
    // to a same-origin absolute path above and cannot be a protocol-relative URL.
    window.location.href = redirectTarget;
  }

  function authHeaders(token?: string): Record<string, string> {
    const t = token ?? localStorage.getItem(accessTokenKey);
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  async function performAuthenticatedRequest<T>(
    path: string,
    options: RequestInit,
    token?: string,
  ): Promise<{ response: Response; data: unknown }> {
    const { headers, ...rest } = options;
    const isFormData = options.body instanceof FormData;
    const contentTypeHeader: Record<string, string> = isFormData
      ? {}
      : { "Content-Type": "application/json" };

    const response = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers: {
        ...contentTypeHeader,
        ...authHeaders(token),
        ...(headers as Record<string, string> | undefined),
      },
    });
    return { response, data: await parseJsonSafely(response) };
  }

  async function authRequest<T>(
    path: string,
    options: RequestInit,
  ): Promise<T> {
    let { response, data } = await performAuthenticatedRequest<T>(path, options);

    if (response.status === 401) {
      if (isRefreshing) {
        return new Promise<T>((resolve, reject) => {
          refreshQueue.push((newToken) => {
            performAuthenticatedRequest<T>(path, options, newToken)
              .then(({ response: retryResponse, data: retryData }) => {
                if (!retryResponse.ok) {
                  reject(apiErrorFromResponse(retryData, retryResponse.status));
                  return;
                }
                resolve(retryData as T);
              })
              .catch(reject);
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await tryRefresh();
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        ({ response, data } = await performAuthenticatedRequest<T>(
          path,
          options,
          newToken,
        ));
      } catch {
        refreshQueue = [];
        clearSessionAndRedirect();
        throw new ApiError("Session expired", 401);
      } finally {
        isRefreshing = false;
      }
    }

    if (response.status === 503 && (data as { maintenance?: boolean }).maintenance) {
      window.location.replace("/maintenance");
      throw new ApiError("Maintenance", 503);
    }

    if (!response.ok) {
      throw apiErrorFromResponse(data, response.status);
    }

    return data as T;
  }

  return {
    request,
    authRequest,
    getAccessToken: () => localStorage.getItem(accessTokenKey),
    getBaseUrl: () => baseUrl,
    clearSessionAndRedirect,
  };
}
