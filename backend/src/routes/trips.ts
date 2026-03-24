import { Router } from "express";
import { z } from "zod";
import { collections } from "../db/collections";
import { firestore } from "../db/firestore";
import { asyncHandler } from "../lib/asyncHandler";
import { toDate, toIso, toNumber } from "../lib/firestoreUtils";
import { HttpError } from "../lib/httpError";
import { trackingHub } from "../services/trackingHub";

const searchSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const tripsRouter = Router();

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
