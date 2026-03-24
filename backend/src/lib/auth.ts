import type { NextFunction, Request, Response } from "express";
import { firebaseAuthAdmin } from "../db/firestore";
import { HttpError } from "./httpError";
import { USER_ROLES, type UserRole } from "../types/auth";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Missing bearer token"));
  }

  const token = header.slice("Bearer ".length);
  try {
    const decoded = await firebaseAuthAdmin.verifyIdToken(token);
    const claimRole = typeof decoded.role === "string" ? decoded.role : undefined;
    const fallbackRole = typeof decoded["custom:role"] === "string" ? decoded["custom:role"] : undefined;
    const resolvedRole = (claimRole ?? fallbackRole ?? "PASSENGER") as UserRole;
    const role = USER_ROLES.includes(resolvedRole) ? resolvedRole : "PASSENGER";
    req.auth = { userId: decoded.uid, role };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new HttpError(401, "Unauthorized"));
    }
    if (!roles.includes(req.auth.role)) {
      return next(new HttpError(403, "Forbidden"));
    }
    return next();
  };
}
