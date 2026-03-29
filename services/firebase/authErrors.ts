import { ApiError } from "../api/client";

export function getAuthErrorMessage(errorCode: string): string {
  const errors: Record<string, string> = {
    "auth/user-not-found": "No account found with this email. Please register first.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/invalid-credential": "Invalid email or password. Please check and try again.",
    "auth/too-many-requests": "Too many failed attempts. Please wait a few minutes and try again.",
    "auth/user-disabled": "This account has been disabled. Please contact support.",
    "auth/network-request-failed": "No internet connection. Please check your network.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/operation-not-allowed": "Email/password login is not enabled. Contact support.",
    "auth/popup-closed-by-user": "Sign-in was cancelled. Please try again.",
    "auth/invalid-api-key": "Firebase API key is wrong or missing. Copy it from Firebase Console → Project settings → Your apps.",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      "Firebase API key is not valid for this app. Check EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_APP_ID in .env.",
    "auth/invalid-app-credential": "Firebase app configuration is wrong. Set EXPO_PUBLIC_FIREBASE_APP_ID (and other keys) from the same web app in Firebase Console.",
  };
  return errors[errorCode] ?? "Something went wrong. Please try again.";
}

export function getFirebaseAuthErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "";
}

/** Maps Firebase sign-in errors, API errors after sign-in, and network failures to a user-visible message. */
export function getLoginFailureMessage(error: unknown): { code: string; message: string } {
  if (error instanceof ApiError) {
    const hint =
      "Cannot reach your backend API. On a real phone: use your PC's LAN IP in EXPO_PUBLIC_API_URL (e.g. http://192.168.1.5:4000/api/v1), same Wi‑Fi, Windows firewall allow port 4000, and restart Expo after changing .env.";
    const message =
      error.status >= 500
        ? `${error.message} (server error)`
        : error.status === 401 || error.status === 403
          ? `${error.message} Try signing in again or register if this is a new account.`
          : error.message === "Request failed" || !error.message
            ? hint
            : `${error.message}. ${hint}`;
    return { code: `http/${error.status}`, message };
  }

  const msg = error instanceof Error ? error.message : "";
  if (
    msg.includes("Network request failed") ||
    msg.includes("Failed to fetch") ||
    msg.includes("fetch failed")
  ) {
    return {
      code: "network",
      message:
        "Network error. Check Wi‑Fi, EXPO_PUBLIC_API_URL (your computer's IP, not localhost), firewall on port 4000, and that the backend is running.",
    };
  }

  const firebaseCode = getFirebaseAuthErrorCode(error);
  if (firebaseCode) {
    return { code: firebaseCode, message: getAuthErrorMessage(firebaseCode) };
  }

  if (msg) {
    return { code: "unknown", message: msg };
  }

  return { code: "", message: "Something went wrong. Please try again." };
}
