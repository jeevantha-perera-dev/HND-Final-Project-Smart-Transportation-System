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
