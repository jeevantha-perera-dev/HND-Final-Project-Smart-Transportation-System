import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, getReactNativePersistence, initializeAuth, type Auth } from "firebase/auth";
import { Platform } from "react-native";

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

const rawAuthHost = process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
const isDev = process.env.NODE_ENV !== "production";
if (isDev) {
  const [host, port = "9099"] = rawAuthHost.split(":");
  const resolvedHost =
    Platform.OS === "android" && (host === "127.0.0.1" || host === "localhost") ? "10.0.2.2" : host;
  const emulatorUrl = `http://${resolvedHost}:${port}`;
  connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
}

export { app, auth };
