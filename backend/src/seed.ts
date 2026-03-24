import { collections } from "./db/collections";
import { firebaseAuthAdmin, firestore } from "./db/firestore";

async function main() {
  async function upsertAuthUser(input: {
    email: string;
    password: string;
    fullName: string;
    role: "PASSENGER" | "DRIVER";
  }) {
    const email = input.email.toLowerCase();
    try {
      const existing = await firebaseAuthAdmin.getUserByEmail(email);
      await firebaseAuthAdmin.setCustomUserClaims(existing.uid, { role: input.role });
      await firebaseAuthAdmin.updateUser(existing.uid, { displayName: input.fullName, password: input.password });
      return existing.uid;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== "auth/user-not-found") throw error;
      const created = await firebaseAuthAdmin.createUser({
        email,
        password: input.password,
        displayName: input.fullName,
      });
      await firebaseAuthAdmin.setCustomUserClaims(created.uid, { role: input.role });
      return created.uid;
    }
  }

  const passengerId = await upsertAuthUser({
    email: "passenger@smartbus.local",
    password: "password123",
    fullName: "Passenger Demo",
    role: "PASSENGER",
  });
  const driverId = await upsertAuthUser({
    email: "driver@smartbus.local",
    password: "password123",
    fullName: "Driver Demo",
    role: "DRIVER",
  });
  const now = new Date().toISOString();

  await firestore.collection(collections.users).doc(passengerId).set({
    id: passengerId,
    fullName: "Passenger Demo",
    email: "passenger@smartbus.local",
    role: "PASSENGER",
    createdAt: now,
    updatedAt: now,
  });

  await firestore.collection(collections.users).doc(driverId).set({
    id: driverId,
    fullName: "Driver Demo",
    email: "driver@smartbus.local",
    role: "DRIVER",
    createdAt: now,
    updatedAt: now,
  });

  await firestore.collection(collections.wallets).doc(passengerId).set({
    id: passengerId,
    userId: passengerId,
    balance: 428.5,
    rewards: [
      { id: "reward-free-weekly-pass", title: "Free Weekly Pass", progress: 0.85 },
      { id: "reward-cashback-booster", title: "Cashback Booster", progress: 0.4 },
    ],
    vouchers: [
      {
        id: "voucher-welcome20",
        code: "WELCOME20",
        value: 20,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      },
    ],
    createdAt: now,
    updatedAt: now,
  });

  await firestore.collection(collections.wallets).doc(driverId).set({
    id: driverId,
    userId: driverId,
    balance: 120,
    rewards: [],
    vouchers: [],
    createdAt: now,
    updatedAt: now,
  });

  await firestore.collection(collections.trips).doc("trip-demo-402").set({
    id: "trip-demo-402",
    routeId: "route-402",
    routeCode: "R-402",
    routeName: "Downtown Express",
    isExpress: true,
    vehicleId: "vehicle-402",
    vehicleCode: "BUS-402",
    driverId,
    originStopCode: "STOP-CENTRAL",
    destinationStopCode: "STOP-OLDTOWN",
    originStopName: "Central Terminal",
    destinationStopName: "Old Town Junction",
    departureAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    arrivalAt: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
    baseFare: 2.5,
    seatsAvailable: 32,
    createdAt: now,
    updatedAt: now,
  });
}

main()
  .then(async () => {
    console.log("Seed completed");
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
