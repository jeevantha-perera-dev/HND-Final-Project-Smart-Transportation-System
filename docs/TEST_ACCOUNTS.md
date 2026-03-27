# Creating test accounts

Firebase Authentication only allows sign-in for users that already exist in your Auth project (or in the **Auth emulator** when the app is pointed at it). The app does not create a user automatically on the login screen—you must register first or create a user in the console/emulator.

## Option A — Firebase Console (production project)

1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. Go to **Build** → **Authentication** → **Users** → **Add user**.
3. Create users you will use for testing, for example:
   - `passenger@smartbus.com` / `Test@12345`
   - `driver@smartbus.com` / `Test@12345`

Use **Email/password** sign-in method enabled under **Sign-in method**.

## Option B — In-app registration

1. On the login screen, tap **Register** (or use the “Create one here” prompt if you tried an unknown email).
2. Complete the form with a real email format (e.g. `you@example.com`).
3. Sign in with that same email and password.

## Option C — Firebase Auth emulator (local)

1. Start emulators from the repo root, for example: `npm run firebase:emulators`.
2. Ensure the app’s `.env` sets `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` to your machine’s address reachable from the device (e.g. `192.168.x.x:9099` on a phone, or `10.0.2.2:9099` for Android emulator).
3. Add users either:
   - In **Emulator UI** → **Authentication** (http://127.0.0.1:4001 when running locally), or  
   - With backend seeding: from `backend/`, run `npm run seed:users` while emulators are running. That creates demo users, for example:
     - `passenger@smartbus.local` / `password123` (passenger)
     - `driver@smartbus.local` / `password123` (driver)

   These addresses are fine for the **emulator** only; for production Firebase, use normal domains (e.g. `@smartbus.com`) or in-app registration.

After creating a user in the **same** Auth instance (production or emulator) that the app uses, login should succeed with no `auth/user-not-found` error.
