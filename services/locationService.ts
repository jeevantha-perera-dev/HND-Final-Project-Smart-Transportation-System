import { apiRequest } from "./api/client";
import { searchTrips, type TripSearchItem } from "./api/trips";
import { fetchTransitEstimate } from "./api/transitEstimate";
import { BusResult, BusStop, CrowdLevel, Journey, Place, type BusResultType } from "../types/bus";
import { computeTripETAs, formatArrivingIn } from "../utils/eta";
import { travelDateKeyToDepartureWindow } from "../utils/travelDate";
import { calculateFare, haversineDistanceKm, roundDistanceKm } from "./transitCalculations";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";
const RETRY_DELAY_MS = 1500;

let lastNominatimRequestAt = 0;

/** Public Overpass endpoints rate-limit aggressively; back off after 429 to avoid log spam and bans. */
let overpassCooldownUntil = 0;
let lastOverpass429LogAt = 0;
const OVERPASS_COOLDOWN_MS = 90_000;
const OVERPASS_429_LOG_INTERVAL_MS = 120_000;

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

/** Same loose rule as backend `includesLoose` for sorting / hints. */
function includesLooseHaystackNeedle(haystack: string, needle: string): boolean {
  const h = haystack.trim().toLowerCase();
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  return h.includes(n) || n.includes(h);
}

/** "To" strings for matching trip `destinationStopName` (autocomplete or typed). */
function destinationSearchHints(toR: Place): string[] {
  const hints = new Set<string>();
  const add = (s: string) => {
    const t = s.trim();
    if (t.length >= 2) hints.add(t);
  };
  add(toR.name);
  add(toR.displayName);
  const head = toR.displayName?.split(",")[0]?.trim() ?? "";
  if (head) add(head);
  return [...hints];
}

/** "From" strings for matching trip `originStopName` (GPS / current location labels included). */
function originSearchHints(fromR: Place): string[] {
  const hints = new Set<string>();
  const add = (s: string) => {
    const t = s.trim();
    if (t.length >= 2) hints.add(t);
  };
  add(fromR.name);
  add(fromR.displayName);
  const head = fromR.displayName?.split(",")[0]?.trim() ?? "";
  if (head) add(head);
  return [...hints];
}

/** Trip must match passenger origin AND destination (same loose rules as the API). */
function tripMatchesPassengerRoute(trip: TripSearchItem, fromR: Place, toR: Place): boolean {
  const o = trip.originStopName || "";
  const d = trip.destinationStopName || "";
  const originOk = originSearchHints(fromR).some((h) => includesLooseHaystackNeedle(o, h));
  const destOk = destinationSearchHints(toR).some((h) => includesLooseHaystackNeedle(d, h));
  return originOk && destOk;
}

/**
 * Pairs of (from,to) query strings so Firestore trip stop names align with maps/autocomplete labels.
 */
function originDestinationSearchAttempts(fromR: Place, toR: Place): Array<{ from: string; to: string }> {
  const attempts: Array<{ from: string; to: string }> = [];
  const push = (from: string, to: string) => {
    const f = from.trim();
    const t = to.trim();
    if (!f || !t) return;
    if (attempts.some((a) => a.from === f && a.to === t)) return;
    attempts.push({ from: f, to: t });
  };

  push(fromR.name, toR.name);
  const fromHead = fromR.displayName?.split(",")[0]?.trim() ?? "";
  const toHead = toR.displayName?.split(",")[0]?.trim() ?? "";
  if (fromHead && toHead) push(fromHead, toHead);
  if (fromHead) push(fromHead, toR.name);
  if (toHead) push(fromR.name, toHead);
  push(fromR.displayName || "", toR.displayName || "");
  return attempts.filter((a) => a.from.length >= 2 && a.to.length >= 2);
}

/**
 * Bookable Firebase trips that serve the passenger's origin → destination (not destination-only).
 * Unions API results across hint pairs, de-duplicates, re-filters client-side, sorts by departure.
 */
async function searchBookableTripsMatchingRoute(
  fromR: Place,
  toR: Place,
  travelDateKey?: string | null
): Promise<TripSearchItem[]> {
  const dayWindow = travelDateKeyToDepartureWindow(travelDateKey);
  const attempts = originDestinationSearchAttempts(fromR, toR);
  const byId = new Map<string, TripSearchItem>();
  for (const q of attempts) {
    try {
      const { items } = await searchTrips({
        from: q.from,
        to: q.to,
        limit: 100,
        minSeats: 1,
        ...(dayWindow ?? {}),
      });
      for (const t of items) {
        if (!byId.has(t.id)) byId.set(t.id, t);
      }
    } catch (e) {
      console.warn("[searchBusRoutes] trips/search (origin+destination) failed for", q, e);
    }
  }
  return [...byId.values()]
    .filter((t) => tripMatchesPassengerRoute(t, fromR, toR))
    .sort((a, b) => (a.arrivalMins ?? 0) - (b.arrivalMins ?? 0));
}

function tripSearchItemToBusResult(
  trip: TripSearchItem,
  fromR: Place,
  toR: Place,
  metrics: TripMetrics,
  index: number
): BusResult {
  const routeId = trip.routeId?.trim() || "R-NA";
  const shortRoute = trip.shortRouteId?.trim() || undefined;
  const originStop: BusStop = {
    id: `${trip.id}-o`,
    name: trip.originStopName?.trim() || fromR.name,
    lat: fromR.lat,
    lon: fromR.lon,
    routes: [routeId],
  };
  const destinationStop: BusStop = {
    id: `${trip.id}-d`,
    name: trip.destinationStopName?.trim() || toR.name,
    lat: toR.lat,
    lon: toR.lon,
    routes: [routeId],
  };

  let type: BusResultType = "Cheapest";
  if (index === 0) type = "Recommended";
  else if (trip.express) type = "Express";

  const arr = Math.max(0, trip.arrivalMins);
  return {
    id: trip.id,
    tripId: trip.id,
    routeNumber: routeId,
    shortRouteNumber: shortRoute,
    routeName: trip.routeName,
    originStop,
    destinationStop,
    durationMinutes: metrics.estimatedMinutes,
    distanceKm: metrics.distanceKm,
    price: trip.price,
    fareLKR: trip.price,
    arrivingInMinutes: arr,
    departureLabel: formatArrivingIn(Math.max(1, arr || 1)),
    seatsAvailable: Math.max(0, trip.seatsLeft),
    crowdLevel: computeCrowdLevel(Math.max(0, trip.seatsLeft)),
    isExpress: Boolean(trip.express),
    type,
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
  const now = Date.now();
  if (now < overpassCooldownUntil) {
    return [];
  }

  const query = `
[out:json][timeout:25];
(
  node["highway"="bus_stop"](around:${radiusMeters},${lat},${lon});
  node["public_transport"="stop_position"](around:${radiusMeters},${lat},${lon});
);
out body;
`.trim();

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

    if (response.status === 429) {
      overpassCooldownUntil = Date.now() + OVERPASS_COOLDOWN_MS;
      if (Date.now() - lastOverpass429LogAt >= OVERPASS_429_LOG_INTERVAL_MS) {
        lastOverpass429LogAt = Date.now();
        console.warn(
          "[overpass] rate limited (HTTP 429). Bus-stop fallback paused ~90s; bookable trips from Firebase still work."
        );
      }
      return [];
    }

    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`);
    }

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
    } else if (!(error instanceof Error && /Overpass HTTP 429/.test(error.message))) {
      console.warn("[overpass] getBusStopsNear failed", error);
    }
    return [];
  }
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

export type SearchBusRoutesOptions = {
  /** `YYYY-MM-DD` — only trips departing on that calendar day (Asia/Colombo). */
  travelDateKey?: string | null;
};

/** Only scheduled trips from the API/Firebase; no OSM Overpass or synthetic buses. */
export async function searchBusRoutes(
  fromPlace: Place,
  toPlace: Place,
  options?: SearchBusRoutesOptions
): Promise<BusResult[]> {
  const [fromR, toR] = await Promise.all([resolvePlaceCoordinates(fromPlace), resolvePlaceCoordinates(toPlace)]);
  const firebaseTrips = await searchBookableTripsMatchingRoute(fromR, toR, options?.travelDateKey);
  if (firebaseTrips.length === 0) {
    return [];
  }
  const seed = `${fromR.id}|${toR.id}`;
  const metrics = await resolveTripMetrics(fromR, toR, seed);
  return firebaseTrips.map((trip, index) => tripSearchItemToBusResult(trip, fromR, toR, metrics, index));
}
