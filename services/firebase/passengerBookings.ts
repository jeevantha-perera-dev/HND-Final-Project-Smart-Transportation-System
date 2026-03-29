import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "./client";
import { getMyBookings, type MyBookingItem, type MyBookingTicket, type MyBookingTrip } from "../api/booking";

const BOOKINGS = "bookings";
const TRIPS = "trips";
const TICKETS = "tickets";

function timestampToIso(value: unknown): string {
  if (value == null) return new Date(0).toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  return new Date(0).toISOString();
}

function tripDocToClient(raw: Record<string, unknown>): MyBookingTrip {
  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    routeId: typeof raw.routeId === "string" ? raw.routeId : undefined,
    routeCode: typeof raw.routeCode === "string" ? raw.routeCode : undefined,
    routeName: typeof raw.routeName === "string" ? raw.routeName : undefined,
    originStopName: typeof raw.originStopName === "string" ? raw.originStopName : undefined,
    destinationStopName: typeof raw.destinationStopName === "string" ? raw.destinationStopName : undefined,
    departureAt: raw.departureAt != null ? timestampToIso(raw.departureAt) : undefined,
    arrivalAt: raw.arrivalAt != null ? timestampToIso(raw.arrivalAt) : undefined,
    completedAt: raw.completedAt != null ? timestampToIso(raw.completedAt) : null,
    status: typeof raw.status === "string" ? raw.status : undefined,
    vehicleId: typeof raw.vehicleId === "string" ? raw.vehicleId : undefined,
    vehicleCode: typeof raw.vehicleCode === "string" ? raw.vehicleCode : undefined,
  };
}

/**
 * Loads the signed-in passenger's bookings and linked trips directly from Firestore
 * (same collections the backend uses).
 */
export async function fetchMyBookingsFromFirestore(): Promise<MyBookingItem[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not signed in");
  }

  const q = query(collection(db, BOOKINGS), where("userId", "==", user.uid));
  const snap = await getDocs(q);
  const items: MyBookingItem[] = [];

  await Promise.all(
    snap.docs.map(async (d) => {
      const b = d.data() as Record<string, unknown>;
      const tripId = String(b.tripId ?? "");
      let trip: MyBookingTrip = null;
      if (tripId) {
        const tripSnap = await getDoc(doc(db, TRIPS, tripId));
        if (tripSnap.exists()) {
          trip = tripDocToClient(tripSnap.data() as Record<string, unknown>);
        }
      }
      const snapRaw = b.tripSnapshot;
      if (!trip && snapRaw && typeof snapRaw === "object") {
        trip = tripDocToClient(snapRaw as Record<string, unknown>);
      }
      const tripSnapshot =
        snapRaw && typeof snapRaw === "object" ? tripDocToClient(snapRaw as Record<string, unknown>) : undefined;
      items.push({
        id: d.id,
        userId: typeof b.userId === "string" ? b.userId : String(b.userId ?? ""),
        tripId,
        seatId: typeof b.seatId === "string" ? b.seatId : String(b.seatId ?? ""),
        status: typeof b.status === "string" ? b.status : String(b.status ?? ""),
        totalAmount: typeof b.totalAmount === "number" ? b.totalAmount : Number(b.totalAmount),
        createdAt: timestampToIso(b.createdAt),
        updatedAt: timestampToIso(b.updatedAt),
        trip,
        tripSnapshot: tripSnapshot ?? undefined,
      });
    })
  );

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
}

/** Ticket document id matches booking id (see POST /bookings/confirm). */
export async function fetchTicketForBooking(bookingId: string): Promise<MyBookingTicket | null> {
  const snap = await getDoc(doc(db, TICKETS, bookingId));
  if (!snap.exists()) return null;
  const t = snap.data() as Record<string, unknown>;
  return {
    id: typeof t.id === "string" ? t.id : bookingId,
    bookingId: typeof t.bookingId === "string" ? t.bookingId : bookingId,
    qrCode: typeof t.qrCode === "string" ? t.qrCode : `QR-${bookingId}`,
    issuedAt: t.issuedAt != null ? timestampToIso(t.issuedAt) : undefined,
  };
}

/** Prefer live Firestore reads; fall back to REST API if the client cannot read Firestore. */
export async function loadPassengerBookingsForTripsScreen(): Promise<MyBookingItem[]> {
  try {
    return await fetchMyBookingsFromFirestore();
  } catch (err) {
    if (__DEV__) {
      console.warn("[Trips] Firestore bookings unreadable, using API:", err);
    }
    const res = await getMyBookings();
    return res.items;
  }
}
