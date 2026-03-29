import { searchTrips, type TripSearchItem } from "./api/trips";
import type { BusResult } from "../types/bus";
import { formatArrivingIn } from "../utils/eta";

function routeLookupVariants(routeNumber: string): string[] {
  const t = routeNumber.trim();
  const out = [t];
  const stripped = t.replace(/^r-?/i, "").trim();
  if (stripped && stripped !== t) out.push(stripped);
  return out;
}

async function findTripForRoute(
  routeNumber: string,
  originHint?: string,
  destHint?: string
): Promise<TripSearchItem | null> {
  for (const code of routeLookupVariants(routeNumber)) {
    const withOd = await searchTrips({
      routeCode: code,
      from: originHint,
      to: destHint,
      limit: 12,
    });
    if (withOd.items[0]) return withOd.items[0];

    const any = await searchTrips({ routeCode: code, limit: 12 });
    if (any.items[0]) return any.items[0];
  }
  return null;
}

export async function enrichBusResultsWithTrips(
  results: BusResult[],
  originLabel?: string,
  destLabel?: string
): Promise<BusResult[]> {
  const out: BusResult[] = [];
  for (const r of results) {
    if (!r.routeNumber?.trim() || r.routeNumber === "N/A") {
      out.push({ ...r, tripId: null });
      continue;
    }
    try {
      const pick = await findTripForRoute(r.routeNumber, originLabel, destLabel);
      if (pick) {
        out.push({
          ...r,
          id: pick.id,
          tripId: pick.id,
          seatsAvailable: Math.max(0, pick.seatsLeft),
          price: pick.price,
          fareLKR: pick.price,
          arrivingInMinutes: Math.max(0, pick.arrivalMins),
          departureLabel: formatArrivingIn(Math.max(1, pick.arrivalMins || 1)),
          crowdLevel: pick.seatsLeft >= 26 ? "Low" : pick.seatsLeft >= 13 ? "Medium" : "High",
        });
      } else {
        out.push({ ...r, tripId: null, seatsAvailable: 0 });
      }
    } catch {
      out.push({ ...r, tripId: null, seatsAvailable: 0 });
    }
  }
  return out;
}
