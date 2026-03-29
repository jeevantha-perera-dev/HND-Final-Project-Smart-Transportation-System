import { listRoutes, type CatalogRoute } from "./api/routes";
import { passengerRouteCode } from "../utils/busDisplay";

export type RouteOriginGroup = {
  id: string;
  name: string;
  routeIds: string;
};

/** Groups Firestore catalog routes by origin stop name for simple passenger lists. */
export async function loadRouteOriginGroups(limit = 50): Promise<RouteOriginGroup[]> {
  const { items } = await listRoutes({ limit });
  const map = new Map<string, string[]>();
  for (const r of items) {
    const o = (r.origin ?? "").trim() || "Unknown";
    if (!map.has(o)) map.set(o, []);
    const arr = map.get(o)!;
    const id = passengerRouteCode(String(r.routeId ?? ""), r.shortRouteId);
    if (id && !arr.includes(id)) arr.push(id);
  }
  return [...map.entries()]
    .map(([name, routeIds], i) => ({
      id: `origin-${i}-${name.slice(0, 24)}`,
      name,
      routeIds: routeIds.join(", "),
    }))
    .slice(0, 24);
}

export function filterExpressRoutes(routes: CatalogRoute[]): CatalogRoute[] {
  return routes.filter((r) => r.isExpress);
}
