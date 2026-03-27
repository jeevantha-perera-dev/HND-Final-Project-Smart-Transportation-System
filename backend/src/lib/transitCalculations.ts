/**
 * Sri Lanka bus helpers: Haversine distance and staged fare.
 * ETAs live in eta.ts (traffic-calibrated speeds).
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

export function roundDistanceKm(km: number): number {
  if (!Number.isFinite(km) || km < 0) return 0;
  const v = Math.round(km * 10) / 10;
  return v < 0.1 && km > 0 ? 0.1 : v;
}
