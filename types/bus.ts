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
  routeNumber: string;
  routeName: string;
  originStop: BusStop;
  destinationStop: BusStop;
  durationMinutes: number;
  distanceKm: number;
  price: number;
  seatsAvailable: number;
  crowdLevel: CrowdLevel;
  departureLabel: string;
  isExpress: boolean;
  type: BusResultType;
};
