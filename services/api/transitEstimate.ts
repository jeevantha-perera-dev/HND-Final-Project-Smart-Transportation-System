import { apiRequest } from "./client";

export type TransitEstimateResponse = {
  distanceKm: number;
  estimatedMinutes: number;
  fareLKR: number;
};

export async function fetchTransitEstimate(input: {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  seed?: string;
}): Promise<TransitEstimateResponse> {
  return apiRequest<TransitEstimateResponse>("/transit/estimate", {
    method: "POST",
    body: {
      fromLat: input.fromLat,
      fromLon: input.fromLon,
      toLat: input.toLat,
      toLon: input.toLon,
      seed: input.seed,
    },
  });
}
