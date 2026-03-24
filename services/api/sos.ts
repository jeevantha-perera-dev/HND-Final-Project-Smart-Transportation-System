import { apiRequest } from "./client";

export async function createSosEvent(input: {
  tripId?: string;
  latitude: number;
  longitude: number;
}) {
  return apiRequest<{ id: string; address?: string; createdAt: string }>("/sos/events", {
    method: "POST",
    auth: true,
    body: input,
  });
}
