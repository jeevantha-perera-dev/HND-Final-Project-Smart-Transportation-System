import { env } from "../config/env";
import { HttpError } from "../lib/httpError";

type IdentitySignInResponse = {
  localId: string;
  email: string;
  idToken: string;
  refreshToken: string;
};

type TokenRefreshResponse = {
  access_token: string;
  refresh_token: string;
  user_id: string;
};

async function identityPost<T>(path: string, body: Record<string, unknown>) {
  const baseUrl = env.APP_FIREBASE_AUTH_EMULATOR_HOST
    ? `http://${env.APP_FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`
    : "https://identitytoolkit.googleapis.com/v1";
  const key = env.APP_FIREBASE_WEB_API_KEY || "demo-emulator-key";
  const url = `${baseUrl}/${path}?key=${key}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as { error?: { message?: string } } & T;
  if (!response.ok) {
    const message = json.error?.message ?? "Firebase Identity operation failed";
    throw new HttpError(400, message);
  }
  return json as T;
}

async function secureTokenPost<T>(body: Record<string, unknown>) {
  const baseUrl = env.APP_FIREBASE_AUTH_EMULATOR_HOST
    ? `http://${env.APP_FIREBASE_AUTH_EMULATOR_HOST}/securetoken.googleapis.com/v1`
    : "https://securetoken.googleapis.com/v1";
  const key = env.APP_FIREBASE_WEB_API_KEY || "demo-emulator-key";
  const url = `${baseUrl}/token?key=${key}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as { error?: { message?: string } } & T;
  if (!response.ok) {
    const message = json.error?.message ?? "Firebase secure token operation failed";
    throw new HttpError(400, message);
  }
  return json as T;
}

export const firebaseIdentityService = {
  signInWithPassword(email: string, password: string) {
    return identityPost<IdentitySignInResponse>("accounts:signInWithPassword", {
      email,
      password,
      returnSecureToken: true,
    });
  },

  refreshIdToken(refreshToken: string) {
    return secureTokenPost<TokenRefreshResponse>({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
  },
};
