import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, getReactNativePersistence, initializeAuth, type Auth } from "firebase/auth";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "smart-transit-local.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "smart-transit-local",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "1:000000000000:web:local",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

const rawAuthHost = process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST?.trim();
const AUTH_EMULATOR_URL = rawAuthHost
  ? rawAuthHost.startsWith("http://") || rawAuthHost.startsWith("https://")
    ? rawAuthHost
    : `http://${rawAuthHost}`
  : null;
const authGlobal = globalThis as typeof globalThis & { __authEmulatorConnected?: boolean };
if (AUTH_EMULATOR_URL && !authGlobal.__authEmulatorConnected) {
  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
  authGlobal.__authEmulatorConnected = true;
}

const storage: FirebaseStorage = getStorage(app);

const rawStorageHost = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST?.trim();
const STORAGE_EMULATOR_HOST = rawStorageHost
  ? rawStorageHost.includes(":")
    ? rawStorageHost.split(":")[0]!
    : rawStorageHost
  : null;
const STORAGE_EMULATOR_PORT = rawStorageHost?.includes(":")
  ? Number(rawStorageHost.split(":")[1]) || 9199
  : 9199;

const storageGlobal = globalThis as typeof globalThis & { __firebaseStorageEmulator?: boolean };
if (STORAGE_EMULATOR_HOST && __DEV__ && !storageGlobal.__firebaseStorageEmulator) {
  connectStorageEmulator(storage, STORAGE_EMULATOR_HOST, STORAGE_EMULATOR_PORT);
  storageGlobal.__firebaseStorageEmulator = true;
}

if (__DEV__) {
  console.log("🔥 Firebase project:", firebaseConfig.projectId);
  console.log("🔥 Auth domain:", firebaseConfig.authDomain);
  if (AUTH_EMULATOR_URL) {
    console.log("🔥 Using Firebase Auth Emulator at", AUTH_EMULATOR_URL);
  }
  if (STORAGE_EMULATOR_HOST) {
    console.log("🔥 Storage emulator:", STORAGE_EMULATOR_HOST, STORAGE_EMULATOR_PORT);
  }
}

export { app, auth, storage };
