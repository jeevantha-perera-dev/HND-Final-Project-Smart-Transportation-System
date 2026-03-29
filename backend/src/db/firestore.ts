import fs from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { env } from "../config/env";

if (env.APP_FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = env.APP_FIREBASE_AUTH_EMULATOR_HOST;
}

type ServiceAccountShape = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function parseServiceAccountJson() {
  if (!env.APP_FIREBASE_SERVICE_ACCOUNT_JSON) {
    return null;
  }
  try {
    const parsed = JSON.parse(env.APP_FIREBASE_SERVICE_ACCOUNT_JSON) as ServiceAccountShape;
    return parsed;
  } catch {
    return null;
  }
}

function loadServiceAccountFromFile(): ServiceAccountShape | null {
  const rawPath = env.APP_FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!rawPath) return null;
  const resolved = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
  try {
    const raw = fs.readFileSync(resolved, "utf8");
    const parsed = JSON.parse(raw) as ServiceAccountShape;
    if (!parsed.private_key || !parsed.client_email || !parsed.project_id) return null;
    return parsed;
  } catch {
    return null;
  }
}

if (getApps().length === 0) {
  const serviceAccount = loadServiceAccountFromFile() ?? parseServiceAccountJson();
  if (serviceAccount) {
    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
      projectId: env.APP_FIREBASE_PROJECT_ID,
    });
  } else {
    initializeApp({
      projectId: env.APP_FIREBASE_PROJECT_ID,
    });
  }
}

export const firestore = getFirestore();
export const firebaseAuthAdmin = getAuth();
