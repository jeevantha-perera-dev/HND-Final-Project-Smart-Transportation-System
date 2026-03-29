import { Router } from "express";
import type { DocumentData } from "firebase-admin/firestore";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { firestore } from "../db/firestore";
import { HttpError } from "../lib/httpError";

const listQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

function serializeRoute(data: DocumentData, docId: string) {
  const shortRouteId = String(data.shortRouteId ?? "").trim();
  return {
    id: docId,
    routeId: String(data.routeId ?? ""),
    shortRouteId: shortRouteId || undefined,
    routeName: String(data.routeName ?? ""),
    origin: String(data.origin ?? ""),
    destination: String(data.destination ?? ""),
    departureTime: String(data.departureTime ?? ""),
    arrivalTime: String(data.arrivalTime ?? ""),
    frequency: String(data.frequency ?? ""),
    busType: String(data.busType ?? ""),
    operatorName: String(data.operatorName ?? ""),
    isExpress: Boolean(data.isExpress),
    isAC: Boolean(data.isAC),
    distanceKm: typeof data.distanceKm === "number" ? data.distanceKm : Number(data.distanceKm) || 0,
    durationMinutes: typeof data.durationMinutes === "number" ? data.durationMinutes : Number(data.durationMinutes) || 0,
    stops: Array.isArray(data.stops) ? data.stops.map(String) : [],
    daysOfOperation: Array.isArray(data.daysOfOperation) ? data.daysOfOperation.map(String) : [],
  };
}

export const routesCatalogRouter = Router();

routesCatalogRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, limit } = listQuerySchema.parse(req.query);
    const snap = await firestore.collection("routes").limit(limit).get();
    let items = snap.docs.map((doc) => serializeRoute(doc.data(), doc.id));
    if (q?.trim()) {
      const needle = q.trim().toLowerCase();
      items = items.filter(
        (r) =>
          r.routeId.toLowerCase().includes(needle) ||
          (r.shortRouteId && r.shortRouteId.toLowerCase().includes(needle)) ||
          r.routeName.toLowerCase().includes(needle) ||
          r.origin.toLowerCase().includes(needle) ||
          r.destination.toLowerCase().includes(needle)
      );
    }
    res.json({ items });
  })
);

routesCatalogRouter.get(
  "/by-route-id/:routeId",
  asyncHandler(async (req, res) => {
    const routeId = z.string().min(1).parse(req.params.routeId);
    const snap = await firestore.collection("routes").where("routeId", "==", routeId).limit(1).get();
    if (snap.empty) throw new HttpError(404, "Route not found");
    const doc = snap.docs[0];
    res.json(serializeRoute(doc.data(), doc.id));
  })
);
