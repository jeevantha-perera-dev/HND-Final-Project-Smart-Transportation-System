/**
 * Sri Lanka bus ETA model
 * ------------------------
 * Road buses rarely sustain “highway car” speeds: urban congestion, stops, two-lane roads,
 * and Colombo-corridor delays mean effective averages stay low. We model piecewise speeds
 * (km/h) by trip length, optionally tighten routes that mention Colombo, then multiply by a
 * small deterministic congestion factor (~1.02–1.16) so totals stay near reported real-world times.
 *
 * Without live tracking, “Arriving in …” uses 60–90% of total journey time (seeded), not a tiny
 * fraction on long intercity legs.
 */

export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Typical effective average speed (km/h) by trip length for scheduled buses in LK conditions.
 */
export function getAverageSpeed(distanceKm: number, _routeType?: string): number {
  const d = Number.isFinite(distanceKm) ? Math.max(0, distanceKm) : 0;
  if (d <= 5) return 12;
  if (d <= 20) return 18;
  if (d <= 50) return 22;
  return 25;
}

/** Colombo metro / approaches: apply ~20% slower effective speed when the route label matches. */
export function applyColomboCongestion(routeLabel: string | undefined, speedKmh: number): number {
  if (!routeLabel || !/colombo/i.test(routeLabel)) return speedKmh;
  return speedKmh * 0.8;
}

/**
 * Congestion multiplier on top of already-low cruise speeds.
 * Piecewise speeds already encode heavy traffic; this adds 2–14% variability (≈1.02–1.16).
 * (Applying a full 1.2–1.8 on top of 12–25 km/h floors makes 50 km legs ~3.5 h+ always.)
 */
export function trafficMultiplier(seed: string): number {
  const u = (hashSeed(`${seed}:traffic`) % 10_001) / 10_001;
  return 1.02 + u * 0.14;
}

export type ComputeTripETAsInput = {
  distanceKm: number;
  seed: string;
  /** e.g. "Mathugama → Colombo" — enables Colombo slowdown when relevant */
  routeLabel?: string;
  /** If live tracking supplies elapsed trip minutes, arrival wait = total − progress. */
  progressMinutes?: number | null;
};

export type ComputeTripETAsResult = {
  totalJourneyMinutes: number;
  arrivingInMinutes: number;
};

/**
 * totalJourneyMinutes ≈ (distance / speed) × 60 × trafficMultiplier
 * arrivingInMinutes ≈ total × (0.6–0.9) without live progress, else total − progress
 */
export function computeTripETAs(input: ComputeTripETAsInput): ComputeTripETAsResult {
  const d = Math.max(0, Number.isFinite(input.distanceKm) ? input.distanceKm : 0);
  let speed = getAverageSpeed(d, undefined);
  speed = applyColomboCongestion(input.routeLabel, speed);
  speed = Math.max(speed, 1);

  const traffic = trafficMultiplier(input.seed);
  let total = (d / speed) * 60 * traffic;

  // Never faster than a heavy-traffic crawl over the same distance
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

/** UI: "~2h 15m journey" / "~45 min journey" */
export function formatJourneyDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 1) return "~1 min journey";
  const m = Math.round(minutes);
  if (m < 60) return `~${m} min journey`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `~${h} hr journey`;
  return `~${h}h ${r}m journey`;
}

/** UI: "Arriving in ~2h 15m" */
export function formatArrivingIn(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 1) return "Arriving in ~1 min";
  const m = Math.round(minutes);
  if (m < 60) return `Arriving in ~${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `Arriving in ~${h} hr`;
  return `Arriving in ~${h}h ${r}m`;
}
