import { apiRequest } from "./client";

export type TripSearchItem = {
  id: string;
  routeId: string;
  routeName: string;
  express: boolean;
  vehicleCode: string;
  arrivalMins: number;
  seatsLeft: number;
  predictedSeats: number;
  price: number;
  departureAt: string;
};

export async function searchTrips(from?: string, to?: string) {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  return apiRequest<{ items: TripSearchItem[] }>(`/trips/search?${query.toString()}`);
}

export async function getTripTracking(tripId: string) {
  return apiRequest<{ tripId: string; latest: any }>(`/trips/${tripId}/tracking`);
}
