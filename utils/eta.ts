/**
 * Sri Lanka bus ETA model (see backend/src/lib/eta.ts for full comments).
 */

export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function getAverageSpeed(distanceKm: number, _routeType?: string): number {
  const d = Number.isFinite(distanceKm) ? Math.max(0, distanceKm) : 0;
  if (d <= 5) return 12;
  if (d <= 20) return 18;
  if (d <= 50) return 22;
  return 25;
}

export function applyColomboCongestion(routeLabel: string | undefined, speedKmh: number): number {
  if (!routeLabel || !/colombo/i.test(routeLabel)) return speedKmh;
  return speedKmh * 0.8;
}

export function trafficMultiplier(seed: string): number {
  const u = (hashSeed(`${seed}:traffic`) % 10_001) / 10_001;
  return 1.02 + u * 0.14;
}

export type ComputeTripETAsInput = {
  distanceKm: number;
  seed: string;
  routeLabel?: string;
  progressMinutes?: number | null;
};

export type ComputeTripETAsResult = {
  totalJourneyMinutes: number;
  arrivingInMinutes: number;
};

export function computeTripETAs(input: ComputeTripETAsInput): ComputeTripETAsResult {
  const d = Math.max(0, Number.isFinite(input.distanceKm) ? input.distanceKm : 0);
  let speed = getAverageSpeed(d, undefined);
  speed = applyColomboCongestion(input.routeLabel, speed);
  speed = Math.max(speed, 1);

  const traffic = trafficMultiplier(input.seed);
  let total = (d / speed) * 60 * traffic;

  const crawlFloor = (d / 12) * 60 * 1.05;
  if (d > 0.05) {
    total = Math.max(total, crawlFloor);
  }

  if (d > 10 && total < 10) {
    total = Math.max(total, crawlFloor, 25);
  }

  let totalJourneyMinutes = Math.max(1, Math.round(total));

  const longRoute = d > 20;
  if (longRoute) {
    totalJourneyMinutes = Math.max(totalJourneyMinutes, 5);
  }

  let arrivingInMinutes: number;
  const progress = input.progressMinutes;
  if (progress != null && Number.isFinite(progress) && progress >= 0) {
    arrivingInMinutes = Math.round(Math.max(0, totalJourneyMinutes - progress));
  } else {
    const u = (hashSeed(`${input.seed}:arrive`) % 10_001) / 10_001;
    const frac = 0.6 + u * 0.3;
    arrivingInMinutes = Math.round(totalJourneyMinutes * frac);
  }

  arrivingInMinutes = Math.min(arrivingInMinutes, Math.max(1, totalJourneyMinutes - 1));

  if (d > 10) {
    arrivingInMinutes = Math.max(arrivingInMinutes, 10);
    arrivingInMinutes = Math.min(arrivingInMinutes, totalJourneyMinutes);
  }
  if (longRoute) {
    arrivingInMinutes = Math.max(arrivingInMinutes, 5);
    arrivingInMinutes = Math.min(arrivingInMinutes, totalJourneyMinutes);
  }

  return { totalJourneyMinutes, arrivingInMinutes };
}

export function formatJourneyDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 1) return "~1 min journey";
  const m = Math.round(minutes);
  if (m < 60) return `~${m} min journey`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `~${h} hr journey`;
  return `~${h}h ${r}m journey`;
}

export function formatArrivingIn(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 1) return "Arriving in ~1 min";
  const m = Math.round(minutes);
  if (m < 60) return `Arriving in ~${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `Arriving in ~${h} hr`;
  return `Arriving in ~${h}h ${r}m`;
}

export function formatArrivingHeadline(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 1) return "1 min";
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `${h} hr`;
  return `${h}h ${r}m`;
}
