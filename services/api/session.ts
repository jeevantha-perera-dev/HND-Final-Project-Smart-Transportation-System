import { auth } from "../firebase/client";

export type AppUser = {
  id: string;
  fullName: string;
  email: string;
  role: "PASSENGER" | "DRIVER" | "ADMIN";
};

type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AppUser | null;
};

const session: SessionState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

export function setSession(next: SessionState) {
  session.accessToken = next.accessToken;
  session.refreshToken = next.refreshToken;
  session.user = next.user;
}

export function clearSession() {
  setSession({ accessToken: null, refreshToken: null, user: null });
  void auth.signOut().catch(() => {
    // no-op on logout cleanup errors
  });
}

export function getSession() {
  return session;
}

export async function getAccessToken() {
  const firebaseToken = await auth.currentUser?.getIdToken();
  if (firebaseToken) return firebaseToken;
  return session.accessToken;
}
