export type Place = {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
};

export type BusStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  routes: string[];
};

export type Journey = {
  durationMinutes: number;
  distanceKm: number;
  geometry: string;
};

export type CrowdLevel = "Low" | "Medium" | "High";

export type BusResultType = "Recommended" | "Cheapest" | "Earliest" | "Express";

export type BusResult = {
  id: string;
  /** Firestore trips doc id when resolved via API; null/undefined if not bookable. */
  tripId?: string | null;
  /** Full route number from trips API (matches fares / route catalog). */
  routeNumber: string;
  /** Shorter display code when backend provides `shortRouteId` on the trip. */
  shortRouteNumber?: string;
  routeName: string;
  originStop: BusStop;
  destinationStop: BusStop;
  /** Full-trip duration (minutes) using Sri Lanka traffic-calibrated bus speeds. */
  durationMinutes: number;
  distanceKm: number;
  /** Single-trip fare (LKR), same as fareLKR for display. */
  price: number;
  fareLKR: number;
  /** Simulated or tracked “arriving in” time (minutes); ~60–90% of journey without live progress. */
  arrivingInMinutes: number;
  seatsAvailable: number;
  /** Modelled seats left when the bus reaches the passenger’s stop (from trip search / API). */
  predictedSeatsWhenArrived: number;
  crowdLevel: CrowdLevel;
  departureLabel: string;
  isExpress: boolean;
  type: BusResultType;
};
