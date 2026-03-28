import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { collections } from "../db/collections";
import { firestore } from "../db/firestore";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireRole } from "../lib/auth";
import { HttpError } from "../lib/httpError";
import { trackingHub } from "../services/trackingHub";

const locationSchema = z.object({
  tripId: z.string().min(1),
  vehicleId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedKph: z.number().optional(),
  heading: z.number().optional(),
  nextStopName: z.string().optional(),
  etaMinutes: z.number().int().positive().optional(),
  seatsAvailable: z.number().int().nonnegative().optional(),
});

export const trackingRouter = Router();

trackingRouter.post(
  "/driver/location",
  requireAuth,
  requireRole("DRIVER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const payload = locationSchema.parse(req.body);
    const tripRef = firestore.collection(collections.trips).doc(payload.tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) throw new HttpError(404, "Trip not found");
    const trip = tripSnap.data()!;
    if (req.auth!.role !== "ADMIN" && String(trip.driverId ?? "") !== req.auth!.userId) {
      throw new HttpError(403, "You are not assigned to this trip");
    }

    const positionId = randomUUID();
    const capturedAt = new Date().toISOString();
    await firestore
      .collection(collections.vehiclePositions)
      .doc(positionId)
      .set({
        id: positionId,
        tripId: payload.tripId,
        vehicleId: payload.vehicleId,
        driverId: req.auth!.userId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        speedKph: payload.speedKph ?? null,
        heading: payload.heading ?? null,
        capturedAt,
      });

    const seats = payload.seatsAvailable ?? Number(trip.seatsAvailable ?? 0);
    if (payload.nextStopName && payload.etaMinutes) {
      const etaId = randomUUID();
      await firestore
        .collection(collections.etaSnapshots)
        .doc(etaId)
        .set({
          id: etaId,
          tripId: payload.tripId,
          nextStopName: payload.nextStopName,
          etaMinutes: payload.etaMinutes,
          seatsAvailable: seats,
          createdAt: capturedAt,
        });
    }

    const latestPayload = {
      tripId: payload.tripId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      speedKph: payload.speedKph,
      heading: payload.heading,
      nextStopName: payload.nextStopName,
      etaMinutes: payload.etaMinutes,
      seatsAvailable: seats,
      capturedAt,
    };

    await firestore.collection(collections.tripTracking).doc(payload.tripId).set({
      ...latestPayload,
      vehicleId: payload.vehicleId,
      driverId: req.auth!.userId,
      updatedAt: capturedAt,
    });

    trackingHub.publish({
      ...latestPayload,
    });

    res.status(201).json({ status: "ok", positionId });
  })
);
