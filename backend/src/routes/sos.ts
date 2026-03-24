import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { collections } from "../db/collections";
import { firestore } from "../db/firestore";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../lib/auth";
import { osmMapsService } from "../services/googleMapsService";

const sosSchema = z.object({
  tripId: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const sosRouter = Router();

sosRouter.post(
  "/events",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = sosSchema.parse(req.body);
    const reverse = await osmMapsService.reverseGeocode(payload.latitude, payload.longitude);
    const firstResult = Array.isArray(reverse.results) ? reverse.results[0] : undefined;
    const address =
      firstResult && typeof firstResult === "object" && "formatted_address" in firstResult
        ? String(firstResult.formatted_address)
        : null;

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await firestore.collection(collections.sosEvents).doc(id).set({
      id,
      userId: req.auth!.userId,
      tripId: payload.tripId ?? null,
      latitude: payload.latitude,
      longitude: payload.longitude,
      reverseAddress: address ?? null,
      createdAt,
    });

    res.status(201).json({
      id,
      address,
      createdAt,
    });
  })
);
