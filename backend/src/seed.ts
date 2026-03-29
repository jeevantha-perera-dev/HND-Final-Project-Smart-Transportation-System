/**
 * Auth + Firestore demo users, wallets, driver trips, and sample bookings.
 *
 * Suggested order (from repo root / backend):
 * 1. npm run seed        — routes + fares (CSV → Firestore)
 * 2. npm run seed:trips  — optional pool trips for passengers
 * 3. npm run seed:users  — this script (same as npm run seed:driver-demo)
 */
import { collections } from "./db/collections";
import { firebaseAuthAdmin, firestore } from "./db/firestore";

type DemoPassengerSeed = {
  email: string;
  fullName: string;
  /** Rich wallet + rewards (main passenger login for UI demos). */
  richWallet?: boolean;
};

/** Sri Lankan names (Sinhala / Tamil, romanized) — one Firestore user per booking for driver queue labels. */
const DEMO_PASSENGERS: DemoPassengerSeed[] = [
  { email: "passenger@smartbus.local", fullName: "Nimal Bandara Perera", richWallet: true },
  { email: "p_demo_02@smartbus.local", fullName: "Sunil Fernando" },
  { email: "p_demo_03@smartbus.local", fullName: "Kamani Wijesinghe" },
  { email: "p_demo_04@smartbus.local", fullName: "Malith Bandara" },
  { email: "p_demo_05@smartbus.local", fullName: "Chaminda Wickramasinghe" },
  { email: "p_demo_06@smartbus.local", fullName: "Tharindu Rajapaksa" },
  { email: "p_demo_07@smartbus.local", fullName: "Dinesh De Silva" },
  { email: "p_demo_08@smartbus.local", fullName: "Pradeep Jayawardena" },
  { email: "p_demo_09@smartbus.local", fullName: "Sanduni Rathnayake" },
  { email: "p_demo_10@smartbus.local", fullName: "Ishara Gunasekara" },
  { email: "p_demo_11@smartbus.local", fullName: "Nuwan Dissanayake" },
  { email: "p_demo_12@smartbus.local", fullName: "Kavindu Samarasinghe" },
  { email: "p_demo_13@smartbus.local", fullName: "Amaya Senanayake" },
  { email: "p_demo_14@smartbus.local", fullName: "Roshan Mendis" },
  { email: "p_demo_15@smartbus.local", fullName: "Sivakumar Shanmugam" },
  { email: "p_demo_16@smartbus.local", fullName: "Priya Thangaraj" },
  { email: "p_demo_17@smartbus.local", fullName: "Kajan Sivaraj" },
  { email: "p_demo_18@smartbus.local", fullName: "Dilan Perera" },
  { email: "p_demo_19@smartbus.local", fullName: "Hashani Fonseka" },
  { email: "p_demo_20@smartbus.local", fullName: "Gayan Herath" },
  { email: "p_demo_21@smartbus.local", fullName: "Imasha Rajapakse" },
];

type SeedDriverDemoArgs = {
  driverId: string;
  passengerUids: string[];
  nowIso: string;
};

async function seedDriverDemoTripsAndBookings({ driverId, passengerUids, nowIso }: SeedDriverDemoArgs) {
  const uidAt = (index: number) => {
    const id = passengerUids[index];
    if (!id) throw new Error(`seed: missing passengerUids[${index}] (need ${DEMO_PASSENGERS.length} passengers)`);
    return id;
  };

  const t = Date.now();
  const depSoon = new Date(t + 90 * 60 * 1000).toISOString();
  const arrSoon = new Date(t + 150 * 60 * 1000).toISOString();
  const depLater = new Date(t + 3 * 60 * 60 * 1000).toISOString();
  const arrLater = new Date(t + 4 * 60 * 60 * 1000).toISOString();
  const depPast1 = new Date(t - 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString();
  const arrPast1 = new Date(t - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString();
  const depPast2 = new Date(t - 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString();
  const arrPast2 = new Date(t - 5 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString();
  const depPast3 = new Date(t - 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString();
  const arrPast3 = new Date(t - 7 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000).toISOString();
  const depPast4 = new Date(t - 10 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString();
  const arrPast4 = new Date(t - 10 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString();
  const depPast5 = new Date(t - 14 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString();
  const arrPast5 = new Date(t - 14 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString();
  const depPast6 = new Date(t - 21 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString();
  const arrPast6 = new Date(t - 21 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString();

  const trips = firestore.collection(collections.trips);

  await trips.doc("trip-demo-402").set({
    id: "trip-demo-402",
    routeId: "138",
    routeCode: "138",
    routeName: "Colombo Fort – Kandy Express",
    isExpress: true,
    vehicleId: "BUS-138",
    vehicleCode: "BUS-138",
    driverId,
    originStopCode: "COLOMBO-FORT",
    destinationStopCode: "KANDY-BUS-STAND",
    originStopName: "Colombo Fort",
    destinationStopName: "Kandy Central Bus Stand",
    departureAt: depSoon,
    arrivalAt: arrSoon,
    baseFare: 280,
    seatsAvailable: 27,
    status: "scheduled",
    notes: "Demo trip — Pettah pickup, express via Katunayake.",
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  await trips.doc("driver_demo_scheduled_1").set({
    id: "driver_demo_scheduled_1",
    routeId: "187",
    routeCode: "187",
    routeName: "Negombo – Kurunegala",
    isExpress: false,
    vehicleId: "BUS-187",
    vehicleCode: "BUS-187",
    driverId,
    originStopCode: "NEGOMBO",
    destinationStopCode: "KURUNEGALA",
    originStopName: "Negombo Bus Terminal",
    destinationStopName: "Kurunegala New Bus Stand",
    departureAt: depLater,
    arrivalAt: arrLater,
    baseFare: 195,
    seatsAvailable: 40,
    status: "scheduled",
    notes: "Second demo slot — use for live queue with sample bookings.",
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  await trips.doc("driver_demo_past_1").set({
    id: "driver_demo_past_1",
    routeId: "154",
    routeCode: "154",
    routeName: "Galle Road – Mount Lavinia",
    isExpress: false,
    vehicleId: "BUS-154",
    vehicleCode: "BUS-154",
    driverId,
    originStopCode: "COLOMBO-LIBRARY",
    destinationStopCode: "MOUNT-LAVINIA",
    originStopName: "Colombo Public Library",
    destinationStopName: "Mount Lavinia Junction",
    departureAt: depPast1,
    arrivalAt: arrPast1,
    baseFare: 120,
    seatsAvailable: 0,
    status: "completed",
    completedAt: arrPast1,
    tripEarningsLkr: 840,
    notes: null,
    createdAt: depPast1,
    updatedAt: nowIso,
  });

  await trips.doc("driver_demo_past_2").set({
    id: "driver_demo_past_2",
    routeId: "176",
    routeCode: "176",
    routeName: "Battaramulla – Nugegoda",
    isExpress: false,
    vehicleId: "BUS-176",
    vehicleCode: "BUS-176",
    driverId,
    originStopCode: "BATTARAMULLA",
    destinationStopCode: "NUGEGODA",
    originStopName: "Battaramulla Transport Hub",
    destinationStopName: "Nugegoda Kohuwala",
    departureAt: depPast2,
    arrivalAt: arrPast2,
    baseFare: 85,
    seatsAvailable: 0,
    status: "completed",
    completedAt: arrPast2,
    tripEarningsLkr: 510,
    notes: null,
    createdAt: depPast2,
    updatedAt: nowIso,
  });

  await trips.doc("driver_demo_past_3").set({
    id: "driver_demo_past_3",
    routeId: "138",
    routeCode: "138",
    routeName: "Panadura – Pettah Express",
    isExpress: true,
    vehicleId: "BUS-138",
    vehicleCode: "BUS-138",
    driverId,
    originStopCode: "PANADURA",
    destinationStopCode: "PETTAH",
    originStopName: "Panadura Bus Stand",
    destinationStopName: "Colombo Pettah Central",
    departureAt: depPast3,
    arrivalAt: arrPast3,
    baseFare: 220,
    seatsAvailable: 0,
    status: "completed",
    completedAt: arrPast3,
    tripEarningsLkr: 1320,
    notes: null,
    createdAt: depPast3,
    updatedAt: nowIso,
  });

  await trips.doc("driver_demo_past_4").set({
    id: "driver_demo_past_4",
    routeId: "119",
    routeCode: "119",
    routeName: "Kottawa – Borella",
    isExpress: false,
    vehicleId: "BUS-119",
    vehicleCode: "BUS-119",
    driverId,
    originStopCode: "KOTTAWA",
    destinationStopCode: "BORELLA",
    originStopName: "Kottawa Junction",
    destinationStopName: "Borella Clock Tower",
    departureAt: depPast4,
    arrivalAt: arrPast4,
    baseFare: 95,
    seatsAvailable: 0,
    status: "completed",
    completedAt: arrPast4,
    tripEarningsLkr: 665,
    notes: null,
    createdAt: depPast4,
    updatedAt: nowIso,
  });

  await trips.doc("driver_demo_past_5").set({
    id: "driver_demo_past_5",
    routeId: "163",
    routeCode: "163",
    routeName: "Homagama – Fort",
    isExpress: false,
    vehicleId: "BUS-163",
    vehicleCode: "BUS-163",
    driverId,
    originStopCode: "HOMAGAMA",
    destinationStopCode: "COLOMBO-FORT",
    originStopName: "Homagama Central",
    destinationStopName: "Colombo Fort",
    departureAt: depPast5,
    arrivalAt: arrPast5,
    baseFare: 110,
    seatsAvailable: 0,
    status: "completed",
    completedAt: arrPast5,
    tripEarningsLkr: 770,
    notes: null,
    createdAt: depPast5,
    updatedAt: nowIso,
  });

  await trips.doc("driver_demo_past_6").set({
    id: "driver_demo_past_6",
    routeId: "200",
    routeCode: "200",
    routeName: "Galle – Matara Coastal",
    isExpress: false,
    vehicleId: "BUS-200",
    vehicleCode: "BUS-200",
    driverId,
    originStopCode: "GALLE",
    destinationStopCode: "MATARA",
    originStopName: "Galle Bus Terminal",
    destinationStopName: "Matara Central",
    departureAt: depPast6,
    arrivalAt: arrPast6,
    baseFare: 180,
    seatsAvailable: 0,
    status: "completed",
    completedAt: arrPast6,
    tripEarningsLkr: 1080,
    notes: null,
    createdAt: depPast6,
    updatedAt: nowIso,
  });

  const bookings = firestore.collection(collections.bookings);
  const scheduled1Id = "driver_demo_scheduled_1";
  const fortTripId = "trip-demo-402";
  const createdEarly = new Date(t - 2 * 60 * 60 * 1000).toISOString();
  const boardedAt1 = new Date(t - 45 * 60 * 1000).toISOString();
  const boardedAt2 = new Date(t - 30 * 60 * 1000).toISOString();

  await bookings.doc("demo_booking_1").set({
    id: "demo_booking_1",
    userId: uidAt(0),
    tripId: scheduled1Id,
    seatId: "3A",
    status: "CONFIRMED",
    totalAmount: 195,
    boarded: true,
    boardedAt: boardedAt1,
    createdAt: createdEarly,
    updatedAt: nowIso,
  });

  await firestore.collection(collections.tickets).doc("demo_booking_1").set({
    id: "demo_booking_1",
    bookingId: "demo_booking_1",
    qrCode: "QR-demo_booking_1",
    issuedAt: createdEarly,
  });

  await bookings.doc("demo_booking_2").set({
    id: "demo_booking_2",
    userId: uidAt(1),
    tripId: scheduled1Id,
    seatId: "4B",
    status: "CONFIRMED",
    totalAmount: 195,
    boarded: true,
    boardedAt: boardedAt2,
    createdAt: createdEarly,
    updatedAt: nowIso,
  });

  await bookings.doc("demo_booking_3").set({
    id: "demo_booking_3",
    userId: uidAt(2),
    tripId: scheduled1Id,
    seatId: "5C",
    status: "PENDING",
    totalAmount: 195,
    boarded: false,
    boardedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  /**
   * Main passenger (passenger@smartbus.local = passengerUids[0]): completed history for My Trips.
   * `tripSnapshot` duplicates trip fields so the app still shows Completed after a successful booking
   * even if `trips/{id}` cannot be read on the client (rules / emulator mismatch).
   */
  const mainPassengerId = uidAt(0);
  const mainCompletedBookings: {
    docId: string;
    tripId: string;
    seatId: string;
    totalAmount: number;
    createdAt: string;
    boardedAt: string;
    tripSnapshot: Record<string, unknown>;
  }[] = [
    {
      docId: "demo_booking_main_past_1",
      tripId: "driver_demo_past_1",
      seatId: "2A",
      totalAmount: 120,
      createdAt: depPast1,
      boardedAt: arrPast1,
      tripSnapshot: {
        id: "driver_demo_past_1",
        routeId: "154",
        routeCode: "154",
        routeName: "Galle Road – Mount Lavinia",
        originStopName: "Colombo Public Library",
        destinationStopName: "Mount Lavinia Junction",
        departureAt: depPast1,
        arrivalAt: arrPast1,
        completedAt: arrPast1,
        status: "completed",
        vehicleId: "BUS-154",
        vehicleCode: "BUS-154",
      },
    },
    {
      docId: "demo_booking_main_past_2",
      tripId: "driver_demo_past_2",
      seatId: "3D",
      totalAmount: 85,
      createdAt: depPast2,
      boardedAt: arrPast2,
      tripSnapshot: {
        id: "driver_demo_past_2",
        routeId: "176",
        routeCode: "176",
        routeName: "Battaramulla – Nugegoda",
        originStopName: "Battaramulla Transport Hub",
        destinationStopName: "Nugegoda Kohuwala",
        departureAt: depPast2,
        arrivalAt: arrPast2,
        completedAt: arrPast2,
        status: "completed",
        vehicleId: "BUS-176",
        vehicleCode: "BUS-176",
      },
    },
    {
      docId: "demo_booking_main_past_3",
      tripId: "driver_demo_past_3",
      seatId: "4B",
      totalAmount: 220,
      createdAt: depPast3,
      boardedAt: arrPast3,
      tripSnapshot: {
        id: "driver_demo_past_3",
        routeId: "138",
        routeCode: "138",
        routeName: "Panadura – Pettah Express",
        originStopName: "Panadura Bus Stand",
        destinationStopName: "Colombo Pettah Central",
        departureAt: depPast3,
        arrivalAt: arrPast3,
        completedAt: arrPast3,
        status: "completed",
        vehicleId: "BUS-138",
        vehicleCode: "BUS-138",
      },
    },
    {
      docId: "demo_booking_main_past_4",
      tripId: "driver_demo_past_4",
      seatId: "1C",
      totalAmount: 95,
      createdAt: depPast4,
      boardedAt: arrPast4,
      tripSnapshot: {
        id: "driver_demo_past_4",
        routeId: "119",
        routeCode: "119",
        routeName: "Kottawa – Borella",
        originStopName: "Kottawa Junction",
        destinationStopName: "Borella Clock Tower",
        departureAt: depPast4,
        arrivalAt: arrPast4,
        completedAt: arrPast4,
        status: "completed",
        vehicleId: "BUS-119",
        vehicleCode: "BUS-119",
      },
    },
    {
      docId: "demo_booking_main_past_5",
      tripId: "driver_demo_past_5",
      seatId: "5A",
      totalAmount: 110,
      createdAt: depPast5,
      boardedAt: arrPast5,
      tripSnapshot: {
        id: "driver_demo_past_5",
        routeId: "163",
        routeCode: "163",
        routeName: "Homagama – Fort",
        originStopName: "Homagama Central",
        destinationStopName: "Colombo Fort",
        departureAt: depPast5,
        arrivalAt: arrPast5,
        completedAt: arrPast5,
        status: "completed",
        vehicleId: "BUS-163",
        vehicleCode: "BUS-163",
      },
    },
    {
      docId: "demo_booking_main_past_6",
      tripId: "driver_demo_past_6",
      seatId: "6F",
      totalAmount: 180,
      createdAt: depPast6,
      boardedAt: arrPast6,
      tripSnapshot: {
        id: "driver_demo_past_6",
        routeId: "200",
        routeCode: "200",
        routeName: "Galle – Matara Coastal",
        originStopName: "Galle Bus Terminal",
        destinationStopName: "Matara Central",
        departureAt: depPast6,
        arrivalAt: arrPast6,
        completedAt: arrPast6,
        status: "completed",
        vehicleId: "BUS-200",
        vehicleCode: "BUS-200",
      },
    },
  ];
  for (const row of mainCompletedBookings) {
    await bookings.doc(row.docId).set({
      id: row.docId,
      userId: mainPassengerId,
      tripId: row.tripId,
      seatId: row.seatId,
      status: "CONFIRMED",
      totalAmount: row.totalAmount,
      boarded: true,
      boardedAt: row.boardedAt,
      createdAt: row.createdAt,
      updatedAt: nowIso,
      tripSnapshot: row.tripSnapshot,
    });
  }

  /** Colombo Fort trip: queue + occupancy + trip earnings (boarded CONFIRMED only) */
  const fortCreated = new Date(t - 4 * 60 * 60 * 1000).toISOString();
  const fortBoardStagger = (minsAgo: number) => new Date(t - minsAgo * 60 * 1000).toISOString();

  const fortBookings: {
    docId: string;
    seatId: string;
    status: "CONFIRMED" | "PENDING";
    boarded: boolean;
    boardedAt: string | null;
  }[] = [
    { docId: "demo_booking_402_1", seatId: "2A", status: "CONFIRMED", boarded: true, boardedAt: fortBoardStagger(50) },
    { docId: "demo_booking_402_2", seatId: "2B", status: "CONFIRMED", boarded: true, boardedAt: fortBoardStagger(48) },
    { docId: "demo_booking_402_3", seatId: "3A", status: "CONFIRMED", boarded: true, boardedAt: fortBoardStagger(40) },
    { docId: "demo_booking_402_4", seatId: "3B", status: "CONFIRMED", boarded: true, boardedAt: fortBoardStagger(35) },
    { docId: "demo_booking_402_5", seatId: "3C", status: "CONFIRMED", boarded: true, boardedAt: fortBoardStagger(32) },
    { docId: "demo_booking_402_6", seatId: "4A", status: "CONFIRMED", boarded: true, boardedAt: fortBoardStagger(25) },
    { docId: "demo_booking_402_7", seatId: "4B", status: "CONFIRMED", boarded: true, boardedAt: fortBoardStagger(20) },
    { docId: "demo_booking_402_8", seatId: "4C", status: "CONFIRMED", boarded: false, boardedAt: null },
    { docId: "demo_booking_402_9", seatId: "5A", status: "CONFIRMED", boarded: false, boardedAt: null },
    { docId: "demo_booking_402_10", seatId: "5B", status: "PENDING", boarded: false, boardedAt: null },
    { docId: "demo_booking_402_11", seatId: "5C", status: "PENDING", boarded: false, boardedAt: null },
    { docId: "demo_booking_402_12", seatId: "5D", status: "PENDING", boarded: false, boardedAt: null },
    { docId: "demo_booking_402_13", seatId: "6A", status: "CONFIRMED", boarded: true, boardedAt: fortBoardStagger(14) },
    { docId: "demo_booking_402_14", seatId: "6B", status: "CONFIRMED", boarded: false, boardedAt: null },
    { docId: "demo_booking_402_15", seatId: "6C", status: "CONFIRMED", boarded: false, boardedAt: null },
    { docId: "demo_booking_402_16", seatId: "7A", status: "CONFIRMED", boarded: true, boardedAt: fortBoardStagger(8) },
    { docId: "demo_booking_402_17", seatId: "7B", status: "PENDING", boarded: false, boardedAt: null },
    { docId: "demo_booking_402_18", seatId: "7C", status: "PENDING", boarded: false, boardedAt: null },
  ];

  for (let i = 0; i < fortBookings.length; i++) {
    const row = fortBookings[i]!;
    await bookings.doc(row.docId).set({
      id: row.docId,
      userId: uidAt(3 + i),
      tripId: fortTripId,
      seatId: row.seatId,
      status: row.status,
      totalAmount: 280,
      boarded: row.boarded,
      boardedAt: row.boardedAt,
      createdAt: fortCreated,
      updatedAt: nowIso,
    });
  }
}

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
      await firebaseAuthAdmin.setCustomUserClaims(existing.uid, {
        role: input.role,
      });
      await firebaseAuthAdmin.updateUser(existing.uid, {
        displayName: input.fullName,
        password: input.password,
      });
      return existing.uid;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== "auth/user-not-found") throw error;
      const created = await firebaseAuthAdmin.createUser({
        email,
        password: input.password,
        displayName: input.fullName,
      });
      await firebaseAuthAdmin.setCustomUserClaims(created.uid, {
        role: input.role,
      });
      return created.uid;
    }
  }

  const driverId = await upsertAuthUser({
    email: "driver@smartbus.local",
    password: "password123",
    fullName: "Ruwan Kumara Dissanayake",
    role: "DRIVER",
  });

  const now = new Date().toISOString();
  const passengerUids: string[] = [];

  for (let i = 0; i < DEMO_PASSENGERS.length; i++) {
    const p = DEMO_PASSENGERS[i]!;
    const uid = await upsertAuthUser({
      email: p.email,
      password: "password123",
      fullName: p.fullName,
      role: "PASSENGER",
    });
    passengerUids.push(uid);

    await firestore.collection(collections.users).doc(uid).set({
      id: uid,
      fullName: p.fullName,
      email: p.email.toLowerCase(),
      role: "PASSENGER",
      createdAt: now,
      updatedAt: now,
    });

    if (p.richWallet) {
      await firestore.collection(collections.wallets).doc(uid).set({
        id: uid,
        userId: uid,
        balance: 428.5,
        transitPoints: 1240,
        rewards: [
          {
            id: "reward-free-weekly-pass",
            title: "Free Weekly Pass",
            progress: 0.85,
          },
          {
            id: "reward-cashback-booster",
            title: "Cashback Booster",
            progress: 0.4,
          },
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

      const t1 = `seed-${uid}-tx1`;
      const t2 = `seed-${uid}-tx2`;
      await firestore.collection(collections.walletTransactions).doc(t1).set(
        {
          id: t1,
          walletId: uid,
          type: "TOPUP",
          amount: 100,
          reference: "wallet-topup",
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        { merge: true }
      );
      await firestore.collection(collections.walletTransactions).doc(t2).set(
        {
          id: t2,
          walletId: uid,
          type: "TOPUP",
          amount: 50,
          reference: "wallet-topup",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        { merge: true }
      );
    } else {
      await firestore.collection(collections.wallets).doc(uid).set({
        id: uid,
        userId: uid,
        balance: 120 + (i % 7) * 15,
        transitPoints: 0,
        rewards: [],
        vouchers: [],
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  await firestore.collection(collections.users).doc(driverId).set({
    id: driverId,
    fullName: "Ruwan Kumara Dissanayake",
    email: "driver@smartbus.local",
    role: "DRIVER",
    createdAt: now,
    updatedAt: now,
  });

  await firestore.collection(collections.wallets).doc(driverId).set({
    id: driverId,
    userId: driverId,
    balance: 120,
    transitPoints: 0,
    rewards: [],
    vouchers: [],
    createdAt: now,
    updatedAt: now,
  });

  await seedDriverDemoTripsAndBookings({ driverId, passengerUids, nowIso: now });
  const mainEmail = DEMO_PASSENGERS[0]?.email ?? "passenger@smartbus.local";
  console.log(
    `Driver demo seeded: ${DEMO_PASSENGERS.length} passengers, trip-demo-402 + ${3 + 6 + 18} bookings, driver_demo_* trips.`
  );
  console.log(
    `  → ${mainEmail}: 6 completed-trip bookings (demo_booking_main_past_1–6) + 1 upcoming (demo_booking_1). Re-run: npm --prefix backend run seed:users`
  );
}

main()
  .then(async () => {
    console.log("Seed completed");
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
