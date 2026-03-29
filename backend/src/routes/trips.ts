import { randomUUID } from "node:crypto";
import { Router } from "express";
import type { DocumentData } from "firebase-admin/firestore";
import { z } from "zod";
import { collections } from "../db/collections";
import { firestore } from "../db/firestore";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../lib/auth";
import { toDate, toIso, toNumber } from "../lib/firestoreUtils";
import { HttpError } from "../lib/httpError";
import { trackingHub } from "../services/trackingHub";

const searchSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  routeCode: z.string().optional(),
  routeId: z.string().optional(),
  departureAfter: z.string().optional(),
  departureBefore: z.string().optional(),
  minSeats: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

function normalizeRouteToken(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function includesLoose(haystack: string, needle: string) {
  const h = haystack.trim().toLowerCase();
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  return h.includes(n) || n.includes(h);
}

const scheduleTripSchema = z
  .object({
    routeCode: z.string().min(1),
    routeName: z.string().min(1),
    vehicleCode: z.string().min(1),
    originStopName: z.string().min(2),
    destinationStopName: z.string().min(2),
    departureAt: z.coerce.date(),
    arrivalAt: z.coerce.date().optional(),
    seatsAvailable: z.coerce.number().int().positive(),
    baseFare: z.coerce.number().nonnegative(),
    notes: z.string().max(500).optional(),
    isExpress: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.arrivalAt && value.arrivalAt <= value.departureAt) {
      ctx.addIssue({
        code: "custom",
        message: "Arrival time must be later than departure time",
        path: ["arrivalAt"],
      });
    }
  });

export const tripsRouter = Router();

tripsRouter.post(
  "/schedule",
  requireAuth,
  requireRole("DRIVER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const payload = scheduleTripSchema.parse(req.body);
    const departureAt = payload.departureAt.toISOString();
    const arrivalAt =
      payload.arrivalAt?.toISOString() ?? new Date(payload.departureAt.getTime() + 45 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    const tripRef = firestore.collection(collections.trips).doc();
    const routeCode = payload.routeCode.trim();
    const vehicleCode = payload.vehicleCode.trim();

    await tripRef.set({
      id: tripRef.id,
      routeId: routeCode,
      routeCode,
      routeName: payload.routeName.trim(),
      isExpress: Boolean(payload.isExpress ?? false),
      vehicleId: vehicleCode,
      vehicleCode,
      driverId: req.auth!.userId,
      originStopCode: payload.originStopName.trim().toUpperCase().replace(/\s+/g, "-"),
      destinationStopCode: payload.destinationStopName.trim().toUpperCase().replace(/\s+/g, "-"),
      originStopName: payload.originStopName.trim(),
      destinationStopName: payload.destinationStopName.trim(),
      departureAt,
      arrivalAt,
      baseFare: payload.baseFare,
      seatsAvailable: payload.seatsAvailable,
      status: "scheduled",
      notes: payload.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json({
      id: tripRef.id,
      routeCode,
      routeName: payload.routeName.trim(),
      vehicleCode,
      departureAt,
      arrivalAt,
      seatsAvailable: payload.seatsAvailable,
      baseFare: payload.baseFare,
      status: "scheduled",
    });
  })
);

tripsRouter.get(
  "/my-scheduled",
  requireAuth,
  requireRole("DRIVER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const tripSnaps = await firestore
      .collection(collections.trips)
      .where("driverId", "==", req.auth!.userId)
      .get();

    const items = tripSnaps.docs
      .map((doc) => {
        const trip = doc.data();
        return {
          id: doc.id,
          routeCode: String(trip.routeCode ?? trip.routeId ?? "R-NA"),
          routeName: String(trip.routeName ?? "Unknown Route"),
          vehicleCode: String(trip.vehicleCode ?? "BUS-NA"),
          originStopName: String(trip.originStopName ?? "Unknown Origin"),
          destinationStopName: String(trip.destinationStopName ?? "Unknown Destination"),
          departureAt: toIso(trip.departureAt),
          arrivalAt: toIso(trip.arrivalAt),
          seatsAvailable: toNumber(trip.seatsAvailable),
          baseFare: toNumber(trip.baseFare),
          status: String(trip.status ?? "scheduled"),
        };
      })
      .filter((trip) => trip.status === "scheduled")
      .sort((a, b) => {
        return new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime();
      });

    res.json({ items });
  })
);

tripsRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = searchSchema.parse(req.query);
    const fetchLimit = Math.min(250, Math.max(50, (q.limit ?? 50) * 5));
    const tripsSnap = await firestore
      .collection(collections.trips)
      .orderBy("departureAt", "asc")
      .limit(fetchLimit)
      .get();

    const now = Date.now();
    const depAfter = q.departureAfter ? new Date(q.departureAfter).getTime() : now;
    const depBefore = q.departureBefore ? new Date(q.departureBefore).getTime() : Number.POSITIVE_INFINITY;
    const routeToken = q.routeCode?.trim() || q.routeId?.trim();
    const normalizedRoute = routeToken ? normalizeRouteToken(routeToken) : "";
    const minSeats = q.minSeats ?? 1;

    const items: {
      id: string;
      routeId: string;
      routeName: string;
      express: boolean;
      vehicleCode: string;
      arrivalMins: number;
      seatsLeft: number;
      predictedSeats: number;
      price: number;
      currency: string;
      departureAt: string;
      originStopName: string;
      destinationStopName: string;
      status: string;
    }[] = [];

    for (const doc of tripsSnap.docs) {
      const trip = doc.data();
      const departureAt = toDate(trip.departureAt);
      const depMs = departureAt.getTime();
      if (depMs < depAfter || depMs > depBefore) continue;

      const status = String(trip.status ?? "scheduled");
      if (status === "cancelled" || status === "completed") continue;

      const seatsLeft = toNumber(trip.seatsAvailable);
      if (seatsLeft < minSeats) continue;

      const code = String(trip.routeCode ?? trip.routeId ?? "");
      if (normalizedRoute) {
        const c1 = normalizeRouteToken(code);
        const c2 = normalizeRouteToken(String(trip.routeId ?? ""));
        if (c1 !== normalizedRoute && c2 !== normalizedRoute && !c1.includes(normalizedRoute) && !normalizedRoute.includes(c1)) {
          continue;
        }
      }

      const originStopName = String(trip.originStopName ?? trip.origin ?? "");
      const destinationStopName = String(trip.destinationStopName ?? trip.destination ?? "");
      if (q.from && !includesLoose(originStopName, q.from)) continue;
      if (q.to && !includesLoose(destinationStopName, q.to)) continue;

      items.push({
        id: doc.id,
        routeId: code || "R-NA",
        routeName: String(trip.routeName ?? "Unknown Route"),
        express: Boolean(trip.isExpress ?? false),
        vehicleCode: String(trip.vehicleCode ?? "BUS-NA"),
        arrivalMins: Math.max(0, Math.round((depMs - now) / 60000)),
        seatsLeft,
        predictedSeats: Math.max(0, seatsLeft - 2),
        price: toNumber(trip.baseFare),
        currency: "LKR",
        departureAt: departureAt.toISOString(),
        originStopName,
        destinationStopName,
        status,
      });
    }

    const limit = q.limit ?? 50;
    res.json({ items: items.slice(0, limit) });
  })
);

tripsRouter.get(
  "/driver-stats",
  requireAuth,
  requireRole("DRIVER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const uid = req.auth!.userId;
    const snap = await firestore.collection(collections.trips).where("driverId", "==", uid).get();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let totalTrips = 0;
    let tripsLast7Days = 0;
    let earningsEstimateLKR = 0;
    for (const doc of snap.docs) {
      totalTrips += 1;
      const data = doc.data();
      const dep = toDate(data.departureAt).getTime();
      if (dep >= weekAgo && dep <= Date.now() + 24 * 60 * 60 * 1000) {
        tripsLast7Days += 1;
      }
      const status = String(data.status ?? "scheduled");
      if (status === "completed") {
        const completedMs = data.completedAt ? toDate(data.completedAt).getTime() : 0;
        if (completedMs >= weekAgo) {
          earningsEstimateLKR += toNumber(data.tripEarningsLkr);
        }
      }
    }
    res.json({
      totalTrips,
      tripsLast7Days,
      currency: "LKR",
      earningsEstimateLKR: Number(earningsEstimateLKR.toFixed(2)),
    });
  })
);

const historyQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(366).optional().default(30),
});

tripsRouter.get(
  "/my-history",
  requireAuth,
  requireRole("DRIVER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { days } = historyQuerySchema.parse(req.query);
    const cutoff = Date.now() - days * 86400000;
    const uid = req.auth!.userId;
    const snap = await firestore.collection(collections.trips).where("driverId", "==", uid).get();

    type Pending = {
      docId: string;
      trip: DocumentData;
      status: string;
      sortMs: number;
    };

    const pending: Pending[] = [];
    for (const doc of snap.docs) {
      const trip = doc.data();
      const status = String(trip.status ?? "scheduled").toLowerCase();
      if (status !== "completed" && status !== "cancelled") continue;
      const sortRaw = trip.completedAt ?? trip.updatedAt ?? trip.departureAt;
      const sortMs = sortRaw ? toDate(sortRaw).getTime() : 0;
      if (sortMs < cutoff) continue;
      pending.push({ docId: doc.id, trip, status, sortMs });
    }

    pending.sort((a, b) => b.sortMs - a.sortMs);

    const items = await Promise.all(
      pending.map(async ({ docId, trip, status }) => {
        let boardedCount = 0;
        if (status === "completed") {
          const [bookingsSnap, walkSnap] = await Promise.all([
            firestore.collection(collections.bookings).where("tripId", "==", docId).get(),
            firestore.collection(collections.trips).doc(docId).collection(collections.tripWalkIns).get(),
          ]);
          for (const b of bookingsSnap.docs) {
            const d = b.data();
            if (String(d.status ?? "") === "CONFIRMED" && d.boarded) boardedCount += 1;
          }
          boardedCount += walkSnap.size;
        }

        return {
          id: docId,
          routeCode: String(trip.routeCode ?? trip.routeId ?? "—"),
          routeName: String(trip.routeName ?? "Unknown route"),
          vehicleCode: String(trip.vehicleCode ?? "—"),
          originStopName: String(trip.originStopName ?? ""),
          destinationStopName: String(trip.destinationStopName ?? ""),
          departureAt: toIso(trip.departureAt),
          completedAt: trip.completedAt ? toIso(trip.completedAt) : null,
          tripEarningsLkr: status === "completed" ? toNumber(trip.tripEarningsLkr) : 0,
          status,
          boardedCount,
        };
      })
    );

    res.json({ items });
  })
);

tripsRouter.post(
  "/:tripId/complete",
  requireAuth,
  requireRole("DRIVER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const tripId = z.string().min(1).parse(req.params.tripId);
    const tripRef = firestore.collection(collections.trips).doc(tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) throw new HttpError(404, "Trip not found");
    const trip = tripSnap.data()!;
    const driverId = String(trip.driverId ?? "");
    if (req.auth!.role !== "ADMIN") {
      if (!driverId || driverId !== req.auth!.userId) {
        throw new HttpError(403, "Not allowed to complete this trip");
      }
    }
    const status = String(trip.status ?? "scheduled");
    if (status === "completed") throw new HttpError(400, "Trip already completed");
    if (status === "cancelled") throw new HttpError(400, "Cannot complete a cancelled trip");

    const bookingsSnap = await firestore.collection(collections.bookings).where("tripId", "==", tripId).get();
    let tripEarningsLkr = 0;
    for (const doc of bookingsSnap.docs) {
      const b = doc.data();
      if (String(b.status ?? "") !== "CONFIRMED") continue;
      if (!b.boarded) continue;
      tripEarningsLkr += toNumber(b.totalAmount);
    }
    const walkInsSnap = await tripRef.collection(collections.tripWalkIns).get();
    for (const doc of walkInsSnap.docs) {
      tripEarningsLkr += toNumber(doc.data().fareLkr);
    }
    tripEarningsLkr = Number(tripEarningsLkr.toFixed(2));
    const now = new Date().toISOString();

    await tripRef.set(
      {
        status: "completed",
        completedAt: now,
        tripEarningsLkr,
        updatedAt: now,
      },
      { merge: true }
    );

    res.json({
      id: tripId,
      status: "completed",
      completedAt: now,
      tripEarningsLkr,
    });
  })
);

tripsRouter.post(
  "/:tripId/cancel",
  requireAuth,
  requireRole("DRIVER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const tripId = z.string().min(1).parse(req.params.tripId);
    const tripRef = firestore.collection(collections.trips).doc(tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) throw new HttpError(404, "Trip not found");
    const trip = tripSnap.data()!;
    const driverId = String(trip.driverId ?? "");
    if (req.auth!.role !== "ADMIN") {
      if (!driverId || driverId !== req.auth!.userId) {
        throw new HttpError(403, "Not allowed to cancel this trip");
      }
    }
    const status = String(trip.status ?? "scheduled").toLowerCase();
    if (status === "completed") throw new HttpError(400, "Cannot cancel a completed trip");
    if (status === "cancelled") throw new HttpError(400, "Trip is already cancelled");

    const now = new Date().toISOString();
    await tripRef.set(
      {
        status: "cancelled",
        cancelledAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    res.json({
      id: tripId,
      status: "cancelled",
      cancelledAt: now,
    });
  })
);

const walkInBodySchema = z.object({
  destinationNote: z.string().max(200).optional(),
  fareLkr: z.number().positive(),
});

async function assertDriverOwnsTrip(
  tripId: string,
  auth: { userId: string; role: string }
) {
  const tripRef = firestore.collection(collections.trips).doc(tripId);
  const tripSnap = await tripRef.get();
  if (!tripSnap.exists) throw new HttpError(404, "Trip not found");
  const trip = tripSnap.data()!;
  const driverId = String(trip.driverId ?? "");
  if (auth.role !== "ADMIN") {
    if (!driverId || driverId !== auth.userId) {
      throw new HttpError(403, "Not allowed for this trip");
    }
  }
  return { tripRef, trip };
}

tripsRouter.get(
  "/:tripId/walk-ins",
  requireAuth,
  requireRole("DRIVER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const tripId = z.string().min(1).parse(req.params.tripId);
    await assertDriverOwnsTrip(tripId, req.auth!);
    const snap = await firestore.collection(collections.trips).doc(tripId).collection(collections.tripWalkIns).get();
    const items = snap.docs
      .map((doc) => {
        const row = doc.data();
        return {
          id: doc.id,
          destinationNote: row.destinationNote != null ? String(row.destinationNote) : "",
          fareLkr: toNumber(row.fareLkr),
          createdAt: toIso(row.createdAt),
        };
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json({ items });
  })
);

tripsRouter.post(
  "/:tripId/walk-ins",
  requireAuth,
  requireRole("DRIVER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const tripId = z.string().min(1).parse(req.params.tripId);
    const { tripRef } = await assertDriverOwnsTrip(tripId, req.auth!);
    const payload = walkInBodySchema.parse(req.body);
    const now = new Date().toISOString();
    const id = randomUUID();
    const col = tripRef.collection(collections.tripWalkIns);
    await col.doc(id).set({
      id,
      tripId,
      destinationNote: payload.destinationNote?.trim() || null,
      fareLkr: Number(payload.fareLkr.toFixed(2)),
      createdAt: now,
      updatedAt: now,
    });
    res.status(201).json({
      id,
      destinationNote: payload.destinationNote?.trim() || "",
      fareLkr: Number(payload.fareLkr.toFixed(2)),
      createdAt: now,
    });
  })
);

tripsRouter.delete(
  "/:tripId/walk-ins/:walkInId",
  requireAuth,
  requireRole("DRIVER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const tripId = z.string().min(1).parse(req.params.tripId);
    const walkInId = z.string().min(1).parse(req.params.walkInId);
    const { tripRef } = await assertDriverOwnsTrip(tripId, req.auth!);
    const docRef = tripRef.collection(collections.tripWalkIns).doc(walkInId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new HttpError(404, "Walk-in not found");
    await docRef.delete();
    res.status(204).end();
  })
);

tripsRouter.get(
  "/:tripId",
  asyncHandler(async (req, res) => {
    const tripId = z.string().min(1).parse(req.params.tripId);
    const tripSnap = await firestore.collection(collections.trips).doc(tripId).get();
    if (!tripSnap.exists) throw new HttpError(404, "Trip not found");
    const trip = tripSnap.data()!;

    const bookingsSnap = await firestore.collection(collections.bookings).where("tripId", "==", tripId).get();
    const occupiedSeatIds = bookingsSnap.docs
      .map((doc) => doc.data())
      .filter((b) => {
        const s = String(b.status ?? "");
        return s === "CONFIRMED" || s === "PENDING";
      })
      .map((b) => String(b.seatId ?? "").trim().toUpperCase())
      .filter(Boolean);

    const etaSnaps = await firestore
      .collection(collections.etaSnapshots)
      .where("tripId", "==", tripId)
      .get();
    let eta: Record<string, unknown> | null = null;
    if (!etaSnaps.empty) {
      let best: (typeof etaSnaps.docs)[number] | null = null;
      let bestMs = -Infinity;
      for (const doc of etaSnaps.docs) {
        const row = doc.data();
        const ms = toDate(row.createdAt).getTime();
        if (ms >= bestMs) {
          bestMs = ms;
          best = doc;
        }
      }
      if (best) {
        const row = best.data();
        eta = {
          ...row,
          createdAt: toIso(row.createdAt),
        };
      }
    }

    res.json({
      id: tripId,
      routeName: String(trip.routeName ?? "Unknown Route"),
      routeCode: String(trip.routeCode ?? trip.routeId ?? ""),
      vehicleCode: String(trip.vehicleCode ?? "BUS-NA"),
      seatsAvailable: toNumber(trip.seatsAvailable),
      baseFare: toNumber(trip.baseFare),
      currency: "LKR",
      departureAt: toIso(trip.departureAt),
      originStopName: String(trip.originStopName ?? ""),
      destinationStopName: String(trip.destinationStopName ?? ""),
      occupiedSeatIds,
      eta,
    });
  })
);

tripsRouter.get(
  "/:tripId/tracking",
  asyncHandler(async (req, res) => {
    const tripId = z.string().min(1).parse(req.params.tripId);
    const latestSnap = await firestore.collection(collections.tripTracking).doc(tripId).get();
    const latestDb = latestSnap.exists ? latestSnap.data() : null;
    const latestInMemory = trackingHub.getLatest(tripId);

    if (!latestDb && !latestInMemory) {
      throw new HttpError(404, "Tracking data not found");
    }

    res.json({
      tripId,
      latest: latestInMemory ?? latestDb,
    });
  })
);
