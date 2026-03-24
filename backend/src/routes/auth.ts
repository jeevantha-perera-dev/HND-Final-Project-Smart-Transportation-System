import { Router } from "express";
import { z } from "zod";
import { collections } from "../db/collections";
import { firebaseAuthAdmin, firestore } from "../db/firestore";
import { asyncHandler } from "../lib/asyncHandler";
import { HttpError } from "../lib/httpError";
import { requireAuth } from "../lib/auth";
import { USER_ROLES } from "../types/auth";
import { firebaseIdentityService } from "../services/firebaseIdentityService";

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES).default("PASSENGER"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    const normalizedEmail = payload.email.trim().toLowerCase();

    try {
      await firebaseAuthAdmin.getUserByEmail(normalizedEmail);
      throw new HttpError(409, "Email already registered");
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code && code !== "auth/user-not-found") {
        throw error;
      }
    }

    const created = await firebaseAuthAdmin.createUser({
      email: normalizedEmail,
      password: payload.password,
      displayName: payload.fullName,
      phoneNumber: payload.phone || undefined,
    });

    await firebaseAuthAdmin.setCustomUserClaims(created.uid, { role: payload.role });

    const now = new Date().toISOString();
    await firestore.collection(collections.users).doc(created.uid).set({
      id: created.uid,
      fullName: payload.fullName,
      email: normalizedEmail,
      phone: payload.phone ?? null,
      role: payload.role,
      createdAt: now,
      updatedAt: now,
    });

    await firestore.collection(collections.wallets).doc(created.uid).set(
      {
        id: created.uid,
        userId: created.uid,
        balance: 0,
        rewards: [],
        vouchers: [],
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    const signIn = await firebaseIdentityService.signInWithPassword(normalizedEmail, payload.password);

    res.status(201).json({
      accessToken: signIn.idToken,
      refreshToken: signIn.refreshToken,
      user: {
        id: created.uid,
        fullName: payload.fullName,
        email: normalizedEmail,
        role: payload.role,
      },
    });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const signIn = await firebaseIdentityService.signInWithPassword(
      payload.email.trim().toLowerCase(),
      payload.password
    );

    const userDocRef = firestore.collection(collections.users).doc(signIn.localId);
    const userDoc = await userDocRef.get();
    let userData = userDoc.data();
    if (!userDoc.exists || !userData) {
      const authUser = await firebaseAuthAdmin.getUser(signIn.localId);
      const role = typeof authUser.customClaims?.role === "string" ? authUser.customClaims.role : "PASSENGER";
      userData = {
        id: signIn.localId,
        fullName: authUser.displayName ?? "",
        email: authUser.email ?? payload.email.trim().toLowerCase(),
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await userDocRef.set(userData, { merge: true });
    }

    res.json({
      accessToken: signIn.idToken,
      refreshToken: signIn.refreshToken,
      user: {
        id: signIn.localId,
        fullName: String(userData.fullName ?? ""),
        email: String(userData.email ?? payload.email.trim().toLowerCase()),
        role: String(userData.role ?? "PASSENGER"),
      },
    });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const payload = refreshSchema.parse(req.body);
    const refreshed = await firebaseIdentityService.refreshIdToken(payload.refreshToken);
    res.json({ accessToken: refreshed.access_token });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    if (req.body?.refreshToken) {
      refreshSchema.parse(req.body);
    }
    res.status(204).send();
  })
);

authRouter.get(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const snap = await firestore.collection(collections.users).doc(req.auth!.userId).get();
    if (!snap.exists) throw new HttpError(404, "User not found");
    const user = snap.data()!;
    res.json({
      id: String(user.id ?? req.auth!.userId),
      fullName: String(user.fullName ?? ""),
      email: String(user.email ?? ""),
      phone: typeof user.phone === "string" ? user.phone : undefined,
      role: String(user.role ?? "PASSENGER"),
    });
  })
);

authRouter.post(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = z
      .object({
        fullName: z.string().min(2).optional(),
        phone: z.string().optional(),
        role: z.enum(USER_ROLES).optional(),
      })
      .parse(req.body);

    const docRef = firestore.collection(collections.users).doc(req.auth!.userId);
    const current = await docRef.get();
    const authUser = await firebaseAuthAdmin.getUser(req.auth!.userId);
    const prev = current.data() ?? {
      id: req.auth!.userId,
      email: authUser.email ?? "",
      fullName: authUser.displayName ?? "",
      phone: authUser.phoneNumber ?? null,
      role: req.auth!.role,
      createdAt: new Date().toISOString(),
    };

    const role = payload.role ?? String(prev.role ?? req.auth!.role);
    await docRef.set(
      {
        id: req.auth!.userId,
        email: prev.email,
        createdAt: prev.createdAt,
        fullName: payload.fullName ?? prev.fullName,
        phone: payload.phone ?? prev.phone ?? null,
        role,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    if (payload.role) {
      await firebaseAuthAdmin.setCustomUserClaims(req.auth!.userId, { role });
    }

    const next = (await docRef.get()).data()!;
    res.json({
      id: String(next.id ?? req.auth!.userId),
      fullName: String(next.fullName ?? ""),
      email: String(next.email ?? ""),
      role: String(next.role ?? "PASSENGER"),
    });
  })
);
