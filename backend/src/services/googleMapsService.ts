import { env } from "../config/env";
import { HttpError } from "../lib/httpError";

type AnyJson = Record<string, unknown>;
const cache = new Map<string, { expiresAt: number; value: AnyJson }>();
const placeDetailsCache = new Map<string, AnyJson>();

function getCacheKey(path: string, params: Record<string, string>) {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return `${path}:${sorted.map(([k, v]) => `${k}=${v}`).join("&")}`;
}

function getCached(path: string, params: Record<string, string>) {
  const key = getCacheKey(path, params);
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(path: string, params: Record<string, string>, value: AnyJson, ttlMs = 60_000) {
  const key = getCacheKey(path, params);
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function toKilometerText(meters: number) {
  if (meters < 1_000) return `${Math.round(meters)} m`;
  return `${(meters / 1_000).toFixed(1)} km`;
}

function toDurationText(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  return `${Math.max(1, Math.round(seconds / 60))} mins`;
}

function parseLatLon(input: string) {
  const match = input.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}

function getRetryDelayMs(attempt: number) {
  const exponential = env.OSM_RETRY_BASE_DELAY_MS * 2 ** attempt;
  const jitterFactor = 0.75 + Math.random() * 0.5;
  return Math.round(exponential * jitterFactor);
}

async function fetchJson(url: URL, label: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= env.OSM_RETRY_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.OSM_HTTP_TIMEOUT_MS);
    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent": env.OSM_USER_AGENT,
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        const error = new HttpError(response.status, `OSM provider request failed for ${label}`);
        if (attempt < env.OSM_RETRY_ATTEMPTS && shouldRetryStatus(response.status)) {
          await sleep(getRetryDelayMs(attempt));
          continue;
        }
        throw error;
      }
      return (await response.json()) as AnyJson;
    } catch (error) {
      lastError = error;
      const maybeHttpError = error instanceof HttpError ? error : null;
      const retryable = !maybeHttpError || shouldRetryStatus(maybeHttpError.statusCode);
      if (attempt < env.OSM_RETRY_ATTEMPTS && retryable) {
        await sleep(getRetryDelayMs(attempt));
        continue;
      }
      if (maybeHttpError) throw maybeHttpError;
      throw new HttpError(502, `OSM provider unavailable for ${label}`);
    } finally {
      clearTimeout(timeout);
    }
  }
  if (lastError instanceof HttpError) throw lastError;
  throw new HttpError(502, `OSM provider unavailable for ${label}`);
}

async function osmGet(path: string, params: Record<string, string>, baseUrl: string) {
  const cached = getCached(path, params);
  if (cached) return cached;

  const url = new URL(path, `${baseUrl}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  const json = await fetchJson(url, path);
  setCached(path, params, json, env.OSM_CACHE_TTL_MS);
  return json;
}

function toGeocodeResult(item: AnyJson) {
  const record = asRecord(item) ?? {};
  const address = asRecord(record.address) ?? {};
  const latitude = Number(record.lat ?? 0);
  const longitude = Number(record.lon ?? 0);
  const osmType = String(record.osm_type ?? "node");
  const osmId = String(record.osm_id ?? `${latitude},${longitude}`);
  const placeId = `osm:${osmType}:${osmId}`;
  const formattedAddress = String(
    record.display_name ??
      [address.house_number, address.road, address.city, address.state, address.country]
        .filter(Boolean)
        .join(", ")
  );
  const result = {
    place_id: placeId,
    formatted_address: formattedAddress,
    geometry: {
      location: {
        lat: latitude,
        lng: longitude,
      },
    },
    types: [String(record.type ?? "unknown")],
  };
  placeDetailsCache.set(placeId, {
    result: {
      place_id: placeId,
      name: String(record.name ?? address.road ?? formattedAddress),
      formatted_address: formattedAddress,
      geometry: {
        location: {
          lat: latitude,
          lng: longitude,
        },
      },
    },
    status: "OK",
  });
  return result;
}

async function resolvePoint(input: string) {
  const parsed = parseLatLon(input);
  if (parsed) {
    return { ...parsed, label: `${parsed.latitude},${parsed.longitude}` };
  }

  const geocode = await osmMapsService.geocode(input);
  const first = Array.isArray(geocode.results) ? geocode.results[0] : undefined;
  const asObj = asRecord(first);
  const geom = asRecord(asObj?.geometry);
  const loc = asRecord(geom?.location);
  const latitude = Number(loc?.lat ?? 0);
  const longitude = Number(loc?.lng ?? 0);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new HttpError(400, `Unable to resolve coordinates for "${input}"`);
  }
  return { latitude, longitude, label: String(asObj?.formatted_address ?? input) };
}

function lkScore(text: string) {
  const value = text.toLowerCase();
  if (value.includes("sri lanka")) return 4;
  if (value.includes("colombo")) return 2;
  return 0;
}

export const osmMapsService = {
  autocomplete(input: string, sessionToken?: string) {
    void sessionToken;
    return (async () => {
      let predictions: Array<{
        description: string;
        place_id: string;
        structured_formatting: { main_text: string; secondary_text: string };
      }> = [];

      try {
        const photon = await osmGet(
          "api",
          {
            q: input,
            limit: "8",
            lang: "en",
          },
          env.OSM_PHOTON_BASE_URL
        );

        const features = Array.isArray(photon.features) ? photon.features : [];
        predictions = features
          .map((feature) => {
            const asObj = asRecord(feature);
            const props = asRecord(asObj?.properties);
            const geometry = asRecord(asObj?.geometry);
            const coordinates = Array.isArray(geometry?.coordinates)
              ? (geometry.coordinates as unknown[])
              : [];
            const longitude = Number(coordinates[0] ?? NaN);
            const latitude = Number(coordinates[1] ?? NaN);
            const osmType = String(props?.osm_type ?? "node");
            const osmId = String(props?.osm_id ?? `${latitude},${longitude}`);
            const placeId = `osm:${osmType}:${osmId}`;
            const mainText = String(props?.name ?? props?.street ?? input);
            const secondaryText = [props?.city, props?.state, props?.country]
              .filter(Boolean)
              .join(", ");
            const description = secondaryText ? `${mainText}, ${secondaryText}` : mainText;
            const countryCode = String(props?.countrycode ?? "").toLowerCase();
            const rankScore = lkScore(description) + (countryCode === env.OSM_DEFAULT_COUNTRY_CODE ? 5 : 0);

            if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
              placeDetailsCache.set(placeId, {
                result: {
                  place_id: placeId,
                  name: mainText,
                  formatted_address: description,
                  geometry: {
                    location: {
                      lat: latitude,
                      lng: longitude,
                    },
                  },
                },
                status: "OK",
              });
            }

            return {
              description,
              place_id: placeId,
              rankScore,
              structured_formatting: {
                main_text: mainText,
                secondary_text: secondaryText,
              },
            };
          })
          .filter((item) => item.place_id && item.description)
          .sort((a, b) => b.rankScore - a.rankScore)
          .slice(0, 8)
          .map(({ rankScore, ...item }) => item);
      } catch {
        const fallback = await osmMapsService.geocode(input);
        const results = Array.isArray(fallback.results) ? fallback.results : [];
        predictions = results
          .map((item) => {
            const asObj = asRecord(item) ?? {};
            const description = String(asObj.formatted_address ?? input);
            return {
              description,
              place_id: String(asObj.place_id ?? description),
              rankScore: lkScore(description),
              structured_formatting: {
                main_text: description.split(",")[0] ?? description,
                secondary_text: description.includes(",") ? description.slice(description.indexOf(",") + 1).trim() : "",
              },
            };
          })
          .sort((a, b) => b.rankScore - a.rankScore)
          .slice(0, 8)
          .map(({ rankScore, ...item }) => item);
      }

      return {
        predictions,
        status: "OK",
      };
    })();
  },

  async placeDetails(placeId: string) {
    const cached = placeDetailsCache.get(placeId);
    if (cached) return cached;

    const osmMatch = placeId.match(/^osm:(node|way|relation):(.+)$/);
    if (osmMatch) {
      const typeChar = osmMatch[1] === "node" ? "N" : osmMatch[1] === "way" ? "W" : "R";
      const lookup = await osmGet(
        "lookup",
        { format: "jsonv2", addressdetails: "1", osm_ids: `${typeChar}${osmMatch[2]}` },
        env.OSM_NOMINATIM_BASE_URL
      );
      const first = Array.isArray(lookup) ? lookup[0] : undefined;
      if (first) {
        const result = {
          result: {
            ...toGeocodeResult(first),
            name: String((asRecord(first)?.name as string | undefined) ?? placeId),
          },
          status: "OK",
        };
        placeDetailsCache.set(placeId, result);
        return result;
      }
    }

    throw new HttpError(404, "Place details not found");
  },

  async geocode(address: string) {
    const data = await osmGet(
      "search",
      {
        q: address,
        format: "jsonv2",
        limit: "5",
        addressdetails: "1",
        countrycodes: env.OSM_DEFAULT_COUNTRY_CODE,
      },
      env.OSM_NOMINATIM_BASE_URL
    );
    const items = Array.isArray(data) ? data : [];
    return {
      results: items.map((item) => toGeocodeResult(item as AnyJson)),
      status: "OK",
    };
  },

  async reverseGeocode(latitude: number, longitude: number) {
    const data = await osmGet(
      "reverse",
      {
        lat: String(latitude),
        lon: String(longitude),
        format: "jsonv2",
        addressdetails: "1",
      },
      env.OSM_NOMINATIM_BASE_URL
    );
    const result = toGeocodeResult(data);
    return {
      results: [result],
      status: "OK",
    };
  },

  async directions(origin: string, destination: string, mode = "driving") {
    const profile = mode === "walking" ? "foot" : "driving";
    const from = await resolvePoint(origin);
    const to = await resolvePoint(destination);
    const routeResponse = await osmGet(
      `route/v1/${profile}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}`,
      {
        overview: "full",
        geometries: "geojson",
        steps: "true",
      },
      env.OSM_ROUTING_BASE_URL
    );

    const routes = Array.isArray(routeResponse.routes) ? routeResponse.routes : [];
    const firstRoute = asRecord(routes[0] ?? null);
    if (!firstRoute) {
      throw new HttpError(404, "No route found");
    }

    const legs = Array.isArray(firstRoute.legs) ? firstRoute.legs : [];
    const firstLeg = asRecord(legs[0] ?? null) ?? {};
    const distanceValue = Number(firstLeg.distance ?? firstRoute.distance ?? 0);
    const durationValue = Number(firstLeg.duration ?? firstRoute.duration ?? 0);

    return {
      routes: [
        {
          summary: String(firstRoute.weight_name ?? "OSM route"),
          geometry: firstRoute.geometry ?? null,
          legs: [
            {
              distance: { value: distanceValue, text: toKilometerText(distanceValue) },
              duration: { value: durationValue, text: toDurationText(durationValue) },
              start_address: from.label,
              end_address: to.label,
              start_location: { lat: from.latitude, lng: from.longitude },
              end_location: { lat: to.latitude, lng: to.longitude },
            },
          ],
        },
      ],
      status: "OK",
    };
  },

  async distanceMatrix(origins: string, destinations: string, mode = "walking") {
    const profile = mode === "walking" ? "foot" : "driving";
    const originInputs = origins
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean);
    const destinationInputs = destinations
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!originInputs.length || !destinationInputs.length) {
      throw new HttpError(400, "Origins and destinations are required");
    }

    const originPoints = await Promise.all(originInputs.map((value) => resolvePoint(value)));
    const destinationPoints = await Promise.all(destinationInputs.map((value) => resolvePoint(value)));

    const combined = [...originPoints, ...destinationPoints];
    const coordinateSet = combined.map((point) => `${point.longitude},${point.latitude}`).join(";");
    const sourceIndexes = originPoints.map((_, index) => String(index)).join(";");
    const destinationIndexes = destinationPoints
      .map((_, index) => String(index + originPoints.length))
      .join(";");

    const table = await osmGet(
      `table/v1/${profile}/${coordinateSet}`,
      {
        annotations: "distance,duration",
        sources: sourceIndexes,
        destinations: destinationIndexes,
      },
      env.OSM_ROUTING_BASE_URL
    );

    const distances = Array.isArray(table.distances) ? table.distances : [];
    const durations = Array.isArray(table.durations) ? table.durations : [];
    const rows = originPoints.map((_, originIdx) => {
      const distanceRow = Array.isArray(distances[originIdx]) ? (distances[originIdx] as unknown[]) : [];
      const durationRow = Array.isArray(durations[originIdx]) ? (durations[originIdx] as unknown[]) : [];
      return {
        elements: destinationPoints.map((__, destinationIdx) => {
          const distanceValue = Number(distanceRow[destinationIdx] ?? 0);
          const durationValue = Number(durationRow[destinationIdx] ?? 0);
          return {
            status: "OK",
            distance: { value: distanceValue, text: toKilometerText(distanceValue) },
            duration: { value: durationValue, text: toDurationText(durationValue) },
          };
        }),
      };
    });

    return {
      destination_addresses: destinationPoints.map((point) => point.label),
      origin_addresses: originPoints.map((point) => point.label),
      rows,
      status: "OK",
    };
  },

  async snapToRoad(path: string) {
    const points = path
      .split("|")
      .map((pair) => parseLatLon(pair))
      .filter((value): value is { latitude: number; longitude: number } => value !== null);
    if (points.length < 2) {
      throw new HttpError(400, "At least two path points are required");
    }

    const coordinates = points.map((point) => `${point.longitude},${point.latitude}`).join(";");
    let coordinatesArray: unknown[] = [];
    try {
      const matched = await osmGet(
        `match/v1/driving/${coordinates}`,
        {
          overview: "full",
          geometries: "geojson",
          tidy: "true",
        },
        env.OSM_ROUTING_BASE_URL
      );
      const matchings = Array.isArray(matched.matchings) ? matched.matchings : [];
      const firstMatching = asRecord(matchings[0] ?? null);
      const geometry = asRecord(firstMatching?.geometry);
      coordinatesArray = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];
    } catch {
      const fallback = await osmGet(
        `route/v1/driving/${coordinates}`,
        {
          overview: "full",
          geometries: "geojson",
        },
        env.OSM_ROUTING_BASE_URL
      );
      const routes = Array.isArray(fallback.routes) ? fallback.routes : [];
      const firstRoute = asRecord(routes[0] ?? null);
      const geometry = asRecord(firstRoute?.geometry);
      coordinatesArray = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];
    }

    const snappedPoints = coordinatesArray
      .map((item) => (Array.isArray(item) ? item : []))
      .filter((item) => item.length >= 2)
      .map((item, index) => ({
        location: {
          latitude: Number(item[1]),
          longitude: Number(item[0]),
        },
        originalIndex: index,
      }));

    return {
      snappedPoints,
      status: "OK",
    };
  },

  async computeRoutes(body: AnyJson) {
    const asObj = asRecord(body) ?? {};
    const origin = asRecord(asObj.origin);
    const destination = asRecord(asObj.destination);
    const originText = String(origin?.address ?? "");
    const destinationText = String(destination?.address ?? "");
    if (!originText || !destinationText) {
      throw new HttpError(400, "origin.address and destination.address are required");
    }
    return osmMapsService.directions(originText, destinationText, "driving");
  },
};

export const googleMapsService = osmMapsService;
