import { apiRequest } from "./client";

export async function publishDriverLocation(input: {
  tripId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speedKph?: number;
  heading?: number;
  nextStopName?: string;
  etaMinutes?: number;
  seatsAvailable?: number;
}) {
  return apiRequest<{ status: string }>("/tracking/driver/location", {
    method: "POST",
    auth: true,
    body: input,
  });
}
