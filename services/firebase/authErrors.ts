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
