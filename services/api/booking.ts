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

export async function getMyBookings() {
  return apiRequest<{ items: any[] }>("/bookings/me", {
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
