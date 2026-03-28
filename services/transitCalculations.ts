/**
 * Client-side transit math (mirrors backend/src/lib/transitCalculations.ts).
 * Used when the estimate API is unreachable so the UI still shows sane numbers.
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

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

export function calculateFare(distanceKm: number): number {
  const dRaw = Number.isFinite(distanceKm) ? Math.max(0, distanceKm) : 0;
  const d = dRaw < 0.05 ? 0 : dRaw;

  if (d <= 5) return 30;
  if (d <= 15) {
    const t = (d - 5) / 10;
    return Math.round(60 + t * 30);
  }
  if (d <= 20) {
    const t = (d - 15) / 5;
    return Math.round(90 + t * 10);
  }
  const over = d - 20;
  return Math.round(100 + Math.ceil(over) * 5);
}

export function roundDistanceKm(km: number): number {
  if (!Number.isFinite(km) || km < 0) return 0;
  const v = Math.round(km * 10) / 10;
  return v < 0.1 && km > 0 ? 0.1 : v;
}
