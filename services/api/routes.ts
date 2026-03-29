import { apiRequest } from "./client";

export type CatalogRoute = {
  id: string;
  routeId: string;
  routeName: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  frequency: string;
  busType: string;
  operatorName: string;
  isExpress: boolean;
  isAC: boolean;
  distanceKm: number;
  durationMinutes: number;
  stops: string[];
  daysOfOperation: string[];
};

export async function listRoutes(params?: { q?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.limit != null) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiRequest<{ items: CatalogRoute[] }>(`/routes${qs ? `?${qs}` : ""}`);
}

export async function getRouteByRouteId(routeId: string) {
  return apiRequest<CatalogRoute>(`/routes/by-route-id/${encodeURIComponent(routeId)}`);
}
