import { apiRequest } from "./client";

export async function seatLock(input: { tripId: string; seatId: string; amount: number }) {
  return apiRequest<{ bookingId: string; expiresAt: string }>("/bookings/seat-lock", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function confirmBooking(bookingId: string) {
  return apiRequest<{ status: string }>("/bookings/confirm", {
    method: "POST",
    auth: true,
    body: { bookingId },
  });
}

/** Trip snapshot from GET /bookings/me (dates as ISO strings). */
export type MyBookingTrip = {
  id?: string;
  routeId?: string;
  routeCode?: string;
  routeName?: string;
  originStopName?: string;
  destinationStopName?: string;
  departureAt?: string;
  arrivalAt?: string;
  completedAt?: string | null;
  status?: string;
  vehicleId?: string;
  vehicleCode?: string;
} | null;

export type MyBookingTicket = {
  id?: string;
  bookingId?: string;
  qrCode?: string;
  issuedAt?: string;
};

export type MyBookingItem = {
  id: string;
  userId?: string;
  tripId?: string;
  seatId?: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt?: string;
  trip: MyBookingTrip;
  /** Denormalized trip (e.g. seed / offline); used when live trips/{id} is missing or unreadable. */
  tripSnapshot?: MyBookingTrip;
  ticket?: MyBookingTicket | null;
};

export async function getMyBookings() {
  return apiRequest<{ items: MyBookingItem[] }>("/bookings/me", {
    auth: true,
  });
}

export type TripBookingRow = {
  id: string;
  seatId: string;
  status: string;
  totalAmount: number;
  currency: string;
  userId: string;
  passengerLabel: string;
  createdAt: string;
  boarded?: boolean;
  boardedAt?: string | null;
};

export async function getBookingsForTrip(tripId: string) {
  return apiRequest<{ items: TripBookingRow[] }>(`/bookings/trip/${encodeURIComponent(tripId)}`, {
    auth: true,
  });
}

export async function setBookingBoarded(bookingId: string, boarded: boolean) {
  return apiRequest<TripBookingRow>(`/bookings/${encodeURIComponent(bookingId)}/boarded`, {
    method: "PATCH",
    auth: true,
    body: { boarded },
  });
}
