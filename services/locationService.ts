import { BusResult, BusStop, CrowdLevel, Journey, Place } from "../types/bus";

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

function estimateFallbackDurationMinutes(distanceKm: number) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  return (distanceKm / 40) * 60;
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
  const normalized = Math.abs(hash % 41); // 0..40
  return normalized + 5; // 5..45
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
      return {
        distanceKm: fallbackDistanceKm,
        durationMinutes: estimateFallbackDurationMinutes(fallbackDistanceKm),
        geometry: "",
      };
    }
  });
}

export async function searchBusRoutes(fromPlace: Place, toPlace: Place): Promise<BusResult[]> {
  const [originStops, destinationStops, journey] = await Promise.all([
    getBusStopsNear(fromPlace.lat, fromPlace.lon, 600),
    getBusStopsNear(toPlace.lat, toPlace.lon, 600),
    getJourney(fromPlace.lat, fromPlace.lon, toPlace.lat, toPlace.lon),
  ]);

  const safeJourney: Journey = journey ?? {
    distanceKm: distanceMeters(fromPlace.lat, fromPlace.lon, toPlace.lat, toPlace.lon) / 1000,
    durationMinutes: estimateFallbackDurationMinutes(
      distanceMeters(fromPlace.lat, fromPlace.lon, toPlace.lat, toPlace.lon) / 1000
    ),
    geometry: "",
  };

  const routeMatches: BusResult[] = [];
  for (const fromStop of originStops) {
    for (const toStop of destinationStops) {
      const common = fromStop.routes.filter((route) => toStop.routes.includes(route));
      for (const routeNumber of common) {
        const id = `${routeNumber}-${fromStop.id}-${toStop.id}`;
        const seatsAvailable = randomSeats(id);
        const isExpress = /e/i.test(routeNumber) || safeJourney.distanceKm > 20;
        routeMatches.push({
          id,
          routeNumber,
          routeName: `${fromStop.name} → ${toStop.name}`,
          originStop: fromStop,
          destinationStop: toStop,
          durationMinutes: Math.max(1, Math.round(safeJourney.durationMinutes)),
          distanceKm: Number(safeJourney.distanceKm.toFixed(1)),
          price: Number((safeJourney.distanceKm * 2.5).toFixed(0)),
          seatsAvailable,
          crowdLevel: computeCrowdLevel(seatsAvailable),
          departureLabel: `Arriving in ~${Math.max(1, Math.round(safeJourney.durationMinutes / 4))}m`,
          isExpress,
          type: isExpress ? "Express" : "Recommended",
        });
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
    name: fromPlace.name,
    lat: fromPlace.lat,
    lon: fromPlace.lon,
    routes: [],
  };
  const fallbackDestination: BusStop = destinationStops[0] ?? {
    id: "destination-fallback",
    name: toPlace.name,
    lat: toPlace.lat,
    lon: toPlace.lon,
    routes: [],
  };

  const fallbackId = `fallback-${fromPlace.id}-${toPlace.id}`;
  const seatsAvailable = randomSeats(fallbackId);
  return [
    {
      id: fallbackId,
      routeNumber: "N/A",
      routeName: `${fromPlace.name} → ${toPlace.name}`,
      originStop: fallbackOrigin,
      destinationStop: fallbackDestination,
      durationMinutes: Math.max(1, Math.round(safeJourney.durationMinutes)),
      distanceKm: Number(safeJourney.distanceKm.toFixed(1)),
      price: Number((safeJourney.distanceKm * 2.5).toFixed(0)),
      seatsAvailable,
      crowdLevel: computeCrowdLevel(seatsAvailable),
      departureLabel: `Arriving in ~${Math.max(1, Math.round(safeJourney.durationMinutes / 4))}m`,
      isExpress: safeJourney.distanceKm > 20,
      type: "Recommended",
    },
  ];
}
