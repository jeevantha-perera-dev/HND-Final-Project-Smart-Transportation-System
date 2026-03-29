export const collections = {
  users: "users",
  wallets: "wallets",
  trips: "trips",
  /** Subcollection under each trip doc: trips/{tripId}/walkIns/{id} */
  tripWalkIns: "walkIns",
  bookings: "bookings",
  seatLocks: "seatLocks",
  tickets: "tickets",
  walletTransactions: "walletTransactions",
  vehiclePositions: "vehiclePositions",
  etaSnapshots: "etaSnapshots",
  tripTracking: "tripTracking",
  sosEvents: "sosEvents",
  bookingIndex: "bookingIndex",
} as const;
