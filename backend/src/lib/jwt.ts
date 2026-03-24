import type { AuthTokenPayload } from "../types/auth";

export function signAccessToken(payload: AuthTokenPayload) {
  return payload.sub;
}

export function signRefreshToken(payload: AuthTokenPayload) {
  return payload.sub;
}

export function verifyAccessToken(token: string) {
  return { sub: token, role: "PASSENGER" } as AuthTokenPayload;
}

export function verifyRefreshToken(token: string) {
  return { sub: token, role: "PASSENGER" } as AuthTokenPayload;
}
