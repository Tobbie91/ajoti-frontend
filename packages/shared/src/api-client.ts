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
  /** Extra localStorage keys to clear on session expiry, beyond access/refresh/user. */
  extraSessionKeys?: string[];
  /** Selects the isolated staff cookie namespace. Customer apps use the default. */
  authScope?: "customer" | "staff";
}

export interface ApiClient {
  request<T>(path: string, options: RequestInit): Promise<T>;
  authRequest<T>(path: string, options: RequestInit): Promise<T>;
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

export function createApiClient(config: ApiClientConfig): ApiClient {
  const {
    baseUrl,
    storagePrefix,
    extraSessionKeys = [],
    authScope = "customer",
  } = config;
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
      credentials: "include",
      headers: {
        ...contentTypeHeader,
        "X-Auth-Scope": authScope,
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
  let refreshQueue: Array<() => void> = [];

  async function tryRefresh(): Promise<void> {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-Auth-Scope": authScope },
      body: JSON.stringify({}),
    });

    if (!res.ok) throw new Error("Refresh failed");

  }

  function clearSessionAndRedirect(): void {
    [userKey, ...extraSessionKeys].forEach(
      (k) => localStorage.removeItem(k),
    );
    window.location.replace("/login");
  }

  async function performAuthenticatedRequest<T>(
    path: string,
    options: RequestInit,
  ): Promise<{ response: Response; data: unknown }> {
    const { headers, ...rest } = options;
    const isFormData = options.body instanceof FormData;
    const contentTypeHeader: Record<string, string> = isFormData
      ? {}
      : { "Content-Type": "application/json" };

    const response = await fetch(`${baseUrl}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        ...contentTypeHeader,
        "X-Auth-Scope": authScope,
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
          refreshQueue.push(() => {
            performAuthenticatedRequest<T>(path, options)
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
        await tryRefresh();
        refreshQueue.forEach((cb) => cb());
        refreshQueue = [];
        ({ response, data } = await performAuthenticatedRequest<T>(
          path,
          options,
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
    getBaseUrl: () => baseUrl,
    clearSessionAndRedirect,
  };
}
