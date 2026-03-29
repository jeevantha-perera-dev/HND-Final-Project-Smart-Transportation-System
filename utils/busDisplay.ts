/** Canonical route id from API (full code); optional compact `shortRouteId` from Firestore for UI. */
export function passengerRouteCode(canonicalRouteId: string, shortRouteId?: string | null): string {
  const s = (shortRouteId ?? "").trim();
  if (s) return s;
  return (canonicalRouteId ?? "").trim();
}

export function passengerRouteDisplayId(canonicalRouteId: string, shortRouteId?: string | null): string {
  return `R-${passengerRouteCode(canonicalRouteId, shortRouteId)}`;
}
