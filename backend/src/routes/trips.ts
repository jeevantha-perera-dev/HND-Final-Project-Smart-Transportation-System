import { Router } from "express";
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
});

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
    searchSchema.parse(req.query);
    const trips = await firestore
      .collection(collections.trips)
      .orderBy("departureAt", "asc")
      .limit(20)
      .get();

    const mapped = trips.docs.map((doc) => {
      const trip = doc.data();
      const departureAt = toDate(trip.departureAt);
      const seatsLeft = toNumber(trip.seatsAvailable);
      return {
        id: doc.id,
        routeId: String(trip.routeCode ?? trip.routeId ?? "R-NA"),
        routeName: String(trip.routeName ?? "Unknown Route"),
        express: Boolean(trip.isExpress ?? false),
        vehicleCode: String(trip.vehicleCode ?? "BUS-NA"),
        arrivalMins: Math.max(1, Math.round((departureAt.getTime() - Date.now()) / 60000)),
        seatsLeft,
        predictedSeats: Math.max(0, seatsLeft - 2),
        price: toNumber(trip.baseFare),
        departureAt: departureAt.toISOString(),
      };
    });

    res.json({ items: mapped });
  })
);

tripsRouter.get(
  "/:tripId",
  asyncHandler(async (req, res) => {
    const tripId = z.string().min(1).parse(req.params.tripId);
    const tripSnap = await firestore.collection(collections.trips).doc(tripId).get();
    if (!tripSnap.exists) throw new HttpError(404, "Trip not found");
    const trip = tripSnap.data()!;

    const etaSnap = await firestore
      .collection(collections.etaSnapshots)
      .where("tripId", "==", tripId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();
    const eta = etaSnap.empty
      ? null
      : {
          ...etaSnap.docs[0].data(),
          createdAt: toIso(etaSnap.docs[0].data().createdAt),
        };

    res.json({
      id: tripId,
      routeName: String(trip.routeName ?? "Unknown Route"),
      vehicleCode: String(trip.vehicleCode ?? "BUS-NA"),
      seatsAvailable: toNumber(trip.seatsAvailable),
      departureAt: toIso(trip.departureAt),
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
