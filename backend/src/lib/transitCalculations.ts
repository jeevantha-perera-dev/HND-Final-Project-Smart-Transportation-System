/**
 * Sri Lanka bus trip helpers: great-circle distance, staged fare model, and time estimates.
 *
 * Haversine: standard formula for distance over a sphere (Earth radius 6371 km).
 * ETA: tripMinutes = (distanceKm / avgBusSpeedKmh) * 60, then optional traffic + deterministic jitter.
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in kilometers. */
export function haversineDistanceKm(fromLat: number, fromLon: number, toLat: number, toLon: number): number {
  if (![fromLat, fromLon, toLat, toLon].every((n) => Number.isFinite(n))) return 0;
  const dLat = toRad(toLat - fromLat);
  const dLon = toRad(toLon - fromLon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Staged Sri Lanka-style bus fare (LKR, integer).
 * Minimum 30; never returns 0.
 */
export function calculateFare(distanceKm: number): number {
  const dRaw = Number.isFinite(distanceKm) ? Math.max(0, distanceKm) : 0;
  // Sub-km noise: treat tiny distances as shortest paid segment
  const d = dRaw < 0.05 ? 0 : dRaw;

  if (d <= 5) return 30;
  if (d <= 15) {
    // 5–15 km → LKR 60–90
    const t = (d - 5) / 10;
    return Math.round(60 + t * 30);
  }
  if (d <= 20) {
    // 15–20 km → ~90–100
    const t = (d - 15) / 5;
    return Math.round(90 + t * 10);
  }
  // >20 km: +5 LKR per km beyond 20
  const over = d - 20;
  return Math.round(100 + Math.ceil(over) * 5);
}

/** FNV-1a-ish hash for stable pseudo-random multipliers from a seed string. */
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Baseline bus trip time: distance / average speed (default 30 km/h for urban/regional SL buses).
 * Then apply trafficFactor (e.g. 1.08) and +/- jitterPct (e.g. 0.05) derived from seed.
 */
export function estimateBusTripMinutes(
  distanceKm: number,
  options?: { avgSpeedKmh?: number; trafficFactor?: number; jitterPct?: number; seed?: string }
): number {
  const speed = options?.avgSpeedKmh ?? 30;
  const traffic = options?.trafficFactor ?? 1.08;
  const jitterPct = options?.jitterPct ?? 0.05;
  const d = Number.isFinite(distanceKm) ? Math.max(0, distanceKm) : 0;
  if (d <= 0) return Math.max(1, Math.round((0.5 / speed) * 60 * traffic));

  let base = (d / speed) * 60 * traffic;
  if (!Number.isFinite(base) || base <= 0) base = Math.max(1, (d / speed) * 60);

  const seed = options?.seed ?? "default";
  const jitterUnit = hashSeed(seed) % 10_000 / 10_000;
  const jitterMult = 1 + (jitterUnit * 2 - 1) * jitterPct;

  return Math.max(1, Math.round(base * jitterMult));
}

/**
 * Shorter “bus arriving at your stop” hint as a fraction of total trip time (deterministic per seed).
 */
export function estimateNearTermArrivalMinutes(tripMinutes: number, seed: string): number {
  const t = Number.isFinite(tripMinutes) ? Math.max(1, tripMinutes) : 5;
  const frac = 0.12 + (hashSeed(seed + ":arrive") % 7) / 100; // 0.12–0.18
  const raw = Math.round(t * frac + 2);
  return Math.max(2, Math.min(25, raw));
}

export function roundDistanceKm(km: number): number {
  if (!Number.isFinite(km) || km < 0) return 0;
  const v = Math.round(km * 10) / 10;
  return v < 0.1 && km > 0 ? 0.1 : v;
}
