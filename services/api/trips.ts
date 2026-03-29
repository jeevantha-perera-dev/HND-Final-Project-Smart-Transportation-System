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
  currency?: string;
  departureAt: string;
  originStopName?: string;
  destinationStopName?: string;
  status?: string;
};

export type TripSearchParams = {
  from?: string;
  to?: string;
  routeCode?: string;
  routeId?: string;
  departureAfter?: string;
  departureBefore?: string;
  minSeats?: number;
  limit?: number;
};

export async function searchTrips(params: TripSearchParams = {}) {
  const query = new URLSearchParams();
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.routeCode) query.set("routeCode", params.routeCode);
  if (params.routeId) query.set("routeId", params.routeId);
  if (params.departureAfter) query.set("departureAfter", params.departureAfter);
  if (params.departureBefore) query.set("departureBefore", params.departureBefore);
  if (params.minSeats != null) query.set("minSeats", String(params.minSeats));
  if (params.limit != null) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiRequest<{ items: TripSearchItem[] }>(`/trips/search${qs ? `?${qs}` : ""}`);
}

export type DriverTripStats = {
  totalTrips: number;
  tripsLast7Days: number;
  currency: string;
  earningsEstimateLKR: number;
};

export async function getDriverTripStats() {
  return apiRequest<DriverTripStats>("/trips/driver-stats", { auth: true });
}

export type TripDetail = {
  id: string;
  routeName: string;
  routeCode: string;
  vehicleCode: string;
  seatsAvailable: number;
  baseFare: number;
  currency: string;
  departureAt: string;
  originStopName: string;
  destinationStopName: string;
  occupiedSeatIds: string[];
  eta: Record<string, unknown> | null;
};

export async function getTripDetail(tripId: string) {
  return apiRequest<TripDetail>(`/trips/${encodeURIComponent(tripId)}`);
}

export async function getTripTracking(tripId: string) {
  return apiRequest<{ tripId: string; latest: any }>(`/trips/${tripId}/tracking`);
}

export type ScheduleTripInput = {
  routeCode: string;
  routeName: string;
  vehicleCode: string;
  originStopName: string;
  destinationStopName: string;
  departureAt: string;
  arrivalAt?: string;
  seatsAvailable: number;
  baseFare: number;
  notes?: string;
  isExpress?: boolean;
};

export type ScheduledTrip = {
  id: string;
  routeCode: string;
  routeName: string;
  vehicleCode: string;
  departureAt: string;
  arrivalAt: string;
  seatsAvailable: number;
  baseFare: number;
  status: "scheduled";
};

export type DriverScheduledTrip = ScheduledTrip & {
  originStopName: string;
  destinationStopName: string;
};

export async function scheduleTrip(input: ScheduleTripInput) {
  return apiRequest<ScheduledTrip>("/trips/schedule", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function getMyScheduledTrips() {
  return apiRequest<{ items: DriverScheduledTrip[] }>("/trips/my-scheduled", {
    auth: true,
  });
}

export type DriverHistoryTrip = {
  id: string;
  routeCode: string;
  routeName: string;
  vehicleCode: string;
  originStopName: string;
  destinationStopName: string;
  departureAt: string;
  completedAt: string | null;
  tripEarningsLkr: number;
  status: "completed" | "cancelled" | string;
  boardedCount: number;
};

export async function getMyTripHistory(params: { days: number }) {
  const days = Math.min(366, Math.max(1, Math.round(params.days)));
  const qs = new URLSearchParams({ days: String(days) });
  return apiRequest<{ items: DriverHistoryTrip[] }>(`/trips/my-history?${qs.toString()}`, {
    auth: true,
  });
}

export async function completeTrip(tripId: string) {
  return apiRequest<{ id: string; status: string; completedAt: string; tripEarningsLkr: number }>(
    `/trips/${encodeURIComponent(tripId)}/complete`,
    { method: "POST", auth: true }
  );
}

export async function cancelTrip(tripId: string) {
  return apiRequest<{ id: string; status: string; cancelledAt: string }>(
    `/trips/${encodeURIComponent(tripId)}/cancel`,
    { method: "POST", auth: true }
  );
}

export type TripWalkInRow = {
  id: string;
  destinationNote: string;
  fareLkr: number;
  createdAt: string;
};

export async function getTripWalkIns(tripId: string) {
  return apiRequest<{ items: TripWalkInRow[] }>(
    `/trips/${encodeURIComponent(tripId)}/walk-ins`,
    { auth: true }
  );
}

export async function addTripWalkIn(
  tripId: string,
  body: { destinationNote?: string; fareLkr: number }
) {
  return apiRequest<TripWalkInRow>(`/trips/${encodeURIComponent(tripId)}/walk-ins`, {
    method: "POST",
    auth: true,
    body,
  });
}

export async function deleteTripWalkIn(tripId: string, walkInId: string) {
  await apiRequest<void>(
    `/trips/${encodeURIComponent(tripId)}/walk-ins/${encodeURIComponent(walkInId)}`,
    { method: "DELETE", auth: true }
  );
}
