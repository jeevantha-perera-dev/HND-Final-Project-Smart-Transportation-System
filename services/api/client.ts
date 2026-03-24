import { clearSession, getAccessToken, getSession } from "./session";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.trim() || "http://localhost:4000/api/v1";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  tokenOverride?: string;
};

export class ApiError extends Error {
  public readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseResponseBody<T>(response: Response): Promise<T | { error?: string } | undefined> {
  if (response.status === 204) return undefined;
  try {
    return (await response.json()) as T | { error?: string };
  } catch {
    return undefined;
  }
}

function toErrorMessage(data: unknown) {
  return typeof data === "object" && data && "error" in data && (data as { error?: string }).error
    ? String((data as { error?: string }).error)
    : "Request failed";
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestOnce = async (tokenOverride?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (options.auth) {
      const token = tokenOverride ?? options.tokenOverride ?? (await getAccessToken()) ?? getSession().accessToken;
      if (token) headers.authorization = `Bearer ${token}`;
    }
    return fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  };

  let response = await requestOnce();
  let data = await parseResponseBody<T>(response);

  if (options.auth && response.status === 401) {
    const refreshedToken = await getAccessToken(true);
    if (refreshedToken) {
      response = await requestOnce(refreshedToken);
      data = await parseResponseBody<T>(response);
    }
    if (response.status === 401) {
      clearSession();
      throw new ApiError(401, "Session expired. Please log in again.");
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, toErrorMessage(data));
  }
  return data as T;
}
