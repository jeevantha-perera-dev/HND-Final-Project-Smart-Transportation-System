import { apiRequest } from "./client";
import { setSession, type AppUser } from "./session";
import { auth } from "../firebase/client";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AppUser;
};

export async function login(input: { email: string; password: string }) {
  const credential = await signInWithEmailAndPassword(auth, input.email.trim().toLowerCase(), input.password);
  const token = await credential.user.getIdToken();
  const profile = await apiRequest<AppUser>("/auth/profile", {
    auth: true,
    tokenOverride: token,
  });

  const res: AuthResponse = {
    accessToken: token,
    refreshToken: credential.user.refreshToken,
    user: profile,
  };

  setSession({
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    user: res.user,
  });
  return res;
}

export async function getAuthProfile() {
  return apiRequest<AppUser>("/auth/profile", { auth: true });
}

export async function updateAuthProfile(body: {
  fullName?: string;
  phone?: string | null;
  photoUrl?: string | null;
}) {
  return apiRequest<AppUser>("/auth/profile", {
    method: "POST",
    auth: true,
    body,
  });
}

export async function register(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: "PASSENGER" | "DRIVER";
}) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    input.email.trim().toLowerCase(),
    input.password
  );
  const token = await credential.user.getIdToken();

  await apiRequest<AppUser>("/auth/profile", {
    method: "POST",
    auth: true,
    tokenOverride: token,
    body: {
      fullName: input.fullName,
      phone: input.phone,
      role: input.role,
    },
  });

  const profile = await apiRequest<AppUser>("/auth/profile", {
    auth: true,
    tokenOverride: token,
  });

  const res: AuthResponse = {
    accessToken: token,
    refreshToken: credential.user.refreshToken,
    user: profile,
  };

  setSession({
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    user: res.user,
  });
  return res;
}
