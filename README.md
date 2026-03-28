# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Local Backend + Firebase (Windows)

Use this for the Firebase-first backend (Auth + Firestore + Functions-compatible API routes) with zero-billing map providers (Nominatim + Photon + OSRM).

1. Install dependencies

   ```powershell
   npm install
   cd backend
   npm install
   ```

2. Configure backend env (`backend/.env`)

   ```env
   APP_FIREBASE_PROJECT_ID=smart-transit-local
   APP_FIREBASE_WEB_API_KEY=your-firebase-web-api-key
   APP_FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   APP_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
   OSM_NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
   OSM_PHOTON_BASE_URL=https://photon.komoot.io
   OSM_ROUTING_BASE_URL=https://router.project-osrm.org
   OSM_USER_AGENT=smart-transportation-system/1.0 (contact: your-email@example.com)
   OSM_RETRY_ATTEMPTS=2
   OSM_RETRY_BASE_DELAY_MS=350
   ```

3. Configure Expo env (`.env` in project root)

   ```env
   EXPO_PUBLIC_API_URL=http://127.0.0.1:4000/api/v1
   EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-web-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
   ```

4. Run local backend + seed Firestore demo data

   ```powershell
   cd backend
   npm run seed
   npm run dev
   ```

5. Start frontend in a second terminal

   ```powershell
   npx expo start
   ```

6. Optional: run Firebase emulators

   ```powershell
   npm run firebase:emulators
   ```

7. Quick backend health check

   ```powershell
   Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4000/api/v1/health
   ```

## Creating test accounts

See [docs/TEST_ACCOUNTS.md](docs/TEST_ACCOUNTS.md) for Firebase Console, in-app registration, and Auth emulator options.

## Smoke Test Checklist

- Register a new passenger in-app (or create a user per [docs/TEST_ACCOUNTS.md](docs/TEST_ACCOUNTS.md)).
- Log in with that account (or demo users from `npm run seed:users` in `backend/` when using the Auth emulator).
- Search trips and open live tracking.
- Lock and confirm a seat booking.
- Top up wallet, transfer funds, and open wallet history.
- Create an SOS event and verify response includes reverse-geocoded address.
- Validate `/api/v1/places/*` and `/api/v1/routing/*` endpoints (OSM-powered).

## Auth Token Troubleshooting (Local Emulators)

- If you see `Invalid or expired token` after emulators or backend restart, sign out and log in again.
- Confirm emulators are running on `9099` (Auth) and `8080` (Firestore), then reseed:
  - `npm run firebase:seed`
- Restart backend and Expo so they reconnect to the current emulator session.
- Ensure root `.env` uses `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=10.0.2.2:9099` for Android emulator.

## Cutover And Rollback

- Cutover mode is controlled by backend URL and Firebase env keys.
- Keep a backup branch of the old Node/Prisma/MySQL backend before production switch.
- Roll back by restoring previous backend env + deployment and point `EXPO_PUBLIC_API_URL` back to the legacy API.
- Do not delete legacy data until Firebase flow parity is validated in staging and production.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
