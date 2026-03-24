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
