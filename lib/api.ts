import { API_URL } from "./config";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateStoredTokens
} from "./auth-storage";
import { notifySessionExpired } from "./sessionEvents";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
  skipRefresh?: boolean;
}

class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

let refreshPromise: Promise<boolean> | null = null;

const refreshAccessToken = async (): Promise<boolean> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-client": "mobile"
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };

      if (!data.accessToken || !data.refreshToken) {
        return false;
      }

      await updateStoredTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Mobile API client — always sends `x-api-client: mobile` and Bearer access token.
 */
export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { method = "GET", body, auth = true, skipRefresh = false } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-client": "mobile"
  };

  if (auth) {
    const accessToken = await getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (response.status === 401 && auth && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
    await clearSession();
    notifySessionExpired();
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      // Never surface raw HTML error pages (e.g. "Cannot GET /api/…") to parents.
      const looksLikeHtml = /^\s*</.test(text);
      payload = looksLikeHtml
        ? {
            message:
              response.status === 404
                ? "This feature isn't available right now."
                : "Something went wrong. Try again."
          }
        : { message: text };
    }
  }

  if (!response.ok) {
    const err = payload as { message?: string; error?: string; code?: string } | null;
    throw new ApiError(
      err?.message ?? err?.error ?? `Request failed (${response.status})`,
      response.status,
      err?.code
    );
  }

  return payload as T;
};

export { ApiError };
