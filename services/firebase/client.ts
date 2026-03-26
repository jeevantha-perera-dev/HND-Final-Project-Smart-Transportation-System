import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, getReactNativePersistence, initializeAuth, type Auth } from "firebase/auth";

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

export { app, auth };
