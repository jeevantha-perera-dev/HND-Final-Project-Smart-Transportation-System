import { apiRequest } from "./api/client";
import { fetchTransitEstimate } from "./api/transitEstimate";
import { BusResult, BusStop, CrowdLevel, Journey, Place } from "../types/bus";
import { computeTripETAs, formatArrivingIn } from "../utils/eta";
import { calculateFare, haversineDistanceKm, roundDistanceKm } from "./transitCalculations";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";
const RETRY_DELAY_MS = 1500;

let lastNominatimRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(aLat: number, aLon: number, bLat: number, bLon: number) {
  const earthRadius = 6371e3;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const p1 = toRad(aLat);
  const p2 = toRad(bLat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

async function withRetry<T>(label: string, task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    console.warn(`[${label}] failed, retrying once`, error);
    await sleep(RETRY_DELAY_MS);
    return task();
  }
}

function parseRouteRefs(value: string | undefined) {
  if (!value) return [];
  return value
    .split(/[;,]/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function computeCrowdLevel(seatsAvailable: number): CrowdLevel {
  if (seatsAvailable >= 26) return "Low";
  if (seatsAvailable >= 13) return "Medium";
  return "High";
}

function randomSeats(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const normalized = Math.abs(hash % 41);
  return normalized + 5;
}

/** True when lat/lon are usable (non-zero and finite). */
export function placeHasCoordinates(place: Pick<Place, "lat" | "lon">): boolean {
  return (
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lon) &&
    (Math.abs(place.lat) > 1e-5 || Math.abs(place.lon) > 1e-5)
  );
}

/**
 * If the user typed an address without picking a suggestion, geocode via backend (Nominatim)
 * or client searchPlaces so distance/fare are not computed from (0,0).
 */
export async function resolvePlaceCoordinates(place: Place): Promise<Place> {
  if (placeHasCoordinates(place)) return place;

  const label = `${place.displayName?.trim() || place.name?.trim() || "Sri Lanka"}`;
  const address = label.includes("Sri Lanka") || label.includes("LK") ? label : `${label}, Sri Lanka`;

  try {
    const data = await apiRequest<{
      results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
    }>("/places/geocode", {
      method: "POST",
      body: { address },
    });
    const loc = data.results?.[0]?.geometry?.location;
    const lat = Number(loc?.lat);
    const lng = Number(loc?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { ...place, lat, lon: lng };
    }
  } catch {
    console.warn("[geocode] /places/geocode failed; trying Nominatim search");
  }

  try {
    const q = place.name?.trim() || place.displayName?.trim() || "Colombo";
    const results = await searchPlaces(q);
    const first = results[0];
    if (first && placeHasCoordinates(first)) {
      return { ...place, lat: first.lat, lon: first.lon, id: place.id || first.id, displayName: place.displayName || first.displayName };
    }
  } catch {
    console.warn("[geocode] Nominatim search fallback failed");
  }

  console.warn("[geocode] Using coarse fallback coordinates for:", label);
  let h = 0;
  for (let i = 0; i < label.length; i += 1) h = (h * 31 + label.charCodeAt(i)) | 0;
  const u = (Math.abs(h) % 1000) / 1000;
  return {
    ...place,
    lat: 6.9271 + u * 0.08,
    lon: 79.8612 + u * 0.08,
  };
}

type TripMetrics = {
  distanceKm: number;
  estimatedMinutes: number;
  arrivingInMinutes: number;
  fareLKR: number;
};

function tripRouteLabel(from: Place, to: Place): string {
  return `${from.name} → ${to.name}`;
}

async function resolveTripMetrics(from: Place, to: Place, seed: string): Promise<TripMetrics> {
  const routeLabel = tripRouteLabel(from, to);
  try {
    const res = await fetchTransitEstimate({
      fromLat: from.lat,
      fromLon: from.lon,
      toLat: to.lat,
      toLon: to.lon,
      seed,
      routeLabel,
    });
    const distanceKm = roundDistanceKm(Number(res.distanceKm));
    const estimatedMinutes = Math.max(1, Math.round(Number(res.estimatedMinutes)));
    let arrivingInMinutes = Math.max(1, Math.round(Number(res.arrivingInMinutes)));
    const fareLKR = Math.max(30, Math.round(Number(res.fareLKR)));
    if (!Number.isFinite(distanceKm)) {
      throw new Error("invalid estimate");
    }
    if (!Number.isFinite(arrivingInMinutes) || arrivingInMinutes <= 0) {
      const local = computeTripETAs({ distanceKm, seed, routeLabel });
      arrivingInMinutes = local.arrivingInMinutes;
    }
    return { distanceKm, estimatedMinutes, arrivingInMinutes, fareLKR };
  } catch (err) {
    console.warn("[transit] estimate API failed, using OSRM + local fare/ETA", err);
    let straightKm = haversineDistanceKm(from.lat, from.lon, to.lat, to.lon);
    let distanceKm = roundDistanceKm(straightKm);
    try {
      const j = await getJourney(from.lat, from.lon, to.lat, to.lon);
      if (j && Number.isFinite(j.distanceKm) && j.distanceKm > 0) {
        distanceKm = roundDistanceKm(j.distanceKm);
      }
    } catch {
      /* use haversine */
    }
    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      distanceKm = 0.1;
    }
    const { totalJourneyMinutes, arrivingInMinutes } = computeTripETAs({
      distanceKm,
      seed,
      routeLabel,
    });
    return {
      distanceKm,
      estimatedMinutes: totalJourneyMinutes,
      arrivingInMinutes,
      fareLKR: calculateFare(distanceKm),
    };
  }
}

function buildBusResultBase(
  metrics: TripMetrics,
  extra: Omit<BusResult, "durationMinutes" | "distanceKm" | "price" | "fareLKR" | "departureLabel" | "arrivingInMinutes">
): BusResult {
  return {
    ...extra,
    durationMinutes: metrics.estimatedMinutes,
    distanceKm: metrics.distanceKm,
    price: metrics.fareLKR,
    fareLKR: metrics.fareLKR,
    arrivingInMinutes: metrics.arrivingInMinutes,
    departureLabel: formatArrivingIn(metrics.arrivingInMinutes),
  };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const input = query.trim();
  if (input.length < 2) return [];

  const elapsed = Date.now() - lastNominatimRequestAt;
  if (elapsed < 1000) {
    await sleep(1000 - elapsed);
  }

  return withRetry("nominatim", async () => {
    try {
      const url = new URL(NOMINATIM_BASE);
      url.searchParams.set("q", input);
      url.searchParams.set("countrycodes", "lk");
      url.searchParams.set("format", "json");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "7");
      lastNominatimRequestAt = Date.now();

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "SmartBusApp/1.0",
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);
      const data = (await response.json()) as Array<Record<string, unknown>>;

      return data.map<Place>((item) => {
        const displayName = String(item.display_name ?? "");
        const first = displayName.split(",")[0]?.trim() || String(item.name ?? "Unknown");
        return {
          id: String(item.place_id ?? displayName),
          name: first,
          displayName,
          lat: Number(item.lat ?? 0),
          lon: Number(item.lon ?? 0),
        };
      });
    } catch (error) {
      console.warn("[nominatim] searchPlaces failed", error);
      return [];
    }
  });
}

export async function getBusStopsNear(lat: number, lon: number, radiusMeters = 500): Promise<BusStop[]> {
  const query = `
[out:json][timeout:25];
(
  node["highway"="bus_stop"](around:${radiusMeters},${lat},${lon});
  node["public_transport"="stop_position"](around:${radiusMeters},${lat},${lon});
);
out body;
`.trim();

  return withRetry("overpass", async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      const body = new URLSearchParams({ data: query }).toString();
      const response = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
      const data = (await response.json()) as {
        elements?: Array<{ id: number; lat: number; lon: number; tags?: Record<string, string> }>;
      };
      const map = new Map<string, BusStop>();
      for (const node of data.elements ?? []) {
        const id = String(node.id);
        if (map.has(id)) continue;
        const tags = node.tags ?? {};
        const name = tags.name || tags.ref || `Stop ${id}`;
        map.set(id, {
          id,
          name,
          lat: Number(node.lat),
          lon: Number(node.lon),
          routes: parseRouteRefs(tags.route_ref),
        });
      }
      return [...map.values()]
        .sort((a, b) => distanceMeters(lat, lon, a.lat, a.lon) - distanceMeters(lat, lon, b.lat, b.lon))
        .slice(0, 20);
    } catch (error) {
      if (error instanceof Error && /abort/i.test(error.message)) {
        console.warn("[overpass] timeout when fetching bus stops");
      } else {
        console.warn("[overpass] getBusStopsNear failed", error);
      }
      return [];
    }
  });
}

export async function getJourney(fromLat: number, fromLon: number, toLat: number, toLon: number): Promise<Journey | null> {
  return withRetry("osrm", async () => {
    try {
      const url = new URL(`${OSRM_URL}/${fromLon},${fromLat};${toLon},${toLat}`);
      url.searchParams.set("overview", "full");
      url.searchParams.set("steps", "true");
      url.searchParams.set("annotations", "false");
      url.searchParams.set("geometries", "polyline");
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
      const data = (await response.json()) as {
        routes?: Array<{ distance?: number; duration?: number; geometry?: string }>;
      };
      const first = data.routes?.[0];
      if (!first) return null;
      return {
        durationMinutes: Number(first.duration ?? 0) / 60,
        distanceKm: Number(first.distance ?? 0) / 1000,
        geometry: String(first.geometry ?? ""),
      };
    } catch (error) {
      console.warn("[osrm] getJourney failed", error);
      const fallbackDistanceKm = distanceMeters(fromLat, fromLon, toLat, toLon) / 1000;
      const d = roundDistanceKm(fallbackDistanceKm);
      const { totalJourneyMinutes } = computeTripETAs({
        distanceKm: d,
        seed: "osrm-fallback",
      });
      return {
        distanceKm: fallbackDistanceKm,
        durationMinutes: totalJourneyMinutes,
        geometry: "",
      };
    }
  });
}

export async function searchBusRoutes(fromPlace: Place, toPlace: Place): Promise<BusResult[]> {
  const [fromR, toR] = await Promise.all([resolvePlaceCoordinates(fromPlace), resolvePlaceCoordinates(toPlace)]);
  const seed = `${fromR.id}|${toR.id}`;

  const metrics = await resolveTripMetrics(fromR, toR, seed);

  const [originStops, destinationStops] = await Promise.all([
    getBusStopsNear(fromR.lat, fromR.lon, 600),
    getBusStopsNear(toR.lat, toR.lon, 600),
  ]);

  const routeMatches: BusResult[] = [];
  for (const fromStop of originStops) {
    for (const toStop of destinationStops) {
      const common = fromStop.routes.filter((route) => toStop.routes.includes(route));
      for (const routeNumber of common) {
        const id = `${routeNumber}-${fromStop.id}-${toStop.id}`;
        const seatsAvailable = 0;
        const isExpress = /e/i.test(routeNumber) || metrics.distanceKm > 20;
        routeMatches.push(
          buildBusResultBase(metrics, {
            id,
            routeNumber,
            routeName: `${fromStop.name} → ${toStop.name}`,
            originStop: fromStop,
            destinationStop: toStop,
            seatsAvailable,
            crowdLevel: computeCrowdLevel(seatsAvailable),
            isExpress,
            type: isExpress ? "Express" : "Recommended",
          })
        );
      }
    }
  }

  if (routeMatches.length) {
    return routeMatches
      .sort((a, b) => a.durationMinutes - b.durationMinutes)
      .map((item, idx) => (idx === 0 ? { ...item, type: "Recommended" } : item));
  }

  const fallbackOrigin: BusStop = originStops[0] ?? {
    id: "origin-fallback",
    name: fromR.name,
    lat: fromR.lat,
    lon: fromR.lon,
    routes: [],
  };
  const fallbackDestination: BusStop = destinationStops[0] ?? {
    id: "destination-fallback",
    name: toR.name,
    lat: toR.lat,
    lon: toR.lon,
    routes: [],
  };

  const fallbackId = `fallback-${fromR.id}-${toR.id}`;
  const seatsAvailable = randomSeats(fallbackId);
  return [
    buildBusResultBase(metrics, {
      id: fallbackId,
      routeNumber: "N/A",
      routeName: `${fromR.name} → ${toR.name}`,
      originStop: fallbackOrigin,
      destinationStop: fallbackDestination,
      seatsAvailable,
      crowdLevel: computeCrowdLevel(seatsAvailable),
      isExpress: metrics.distanceKm > 20,
      type: "Recommended",
    }),
  ];
}
