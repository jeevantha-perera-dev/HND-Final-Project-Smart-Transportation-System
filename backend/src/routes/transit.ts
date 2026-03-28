import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { rateLimit } from "../lib/rateLimit";
import { computeTripETAs } from "../lib/eta";
import { calculateFare, haversineDistanceKm, roundDistanceKm } from "../lib/transitCalculations";
import { osmMapsService } from "../services/googleMapsService";

const estimateSchema = z.object({
  fromLat: z.number().finite(),
  fromLon: z.number().finite(),
  toLat: z.number().finite(),
  toLon: z.number().finite(),
  seed: z.string().optional(),
  routeLabel: z.string().optional(),
  progressMinutes: z.number().finite().min(0).optional(),
});

function isPlausibleLatLon(lat: number, lon: number) {
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

export const transitRouter = Router();
transitRouter.use(rateLimit({ windowMs: 60_000, max: 120 }));

transitRouter.post(
  "/estimate",
  asyncHandler(async (req, res) => {
    const body = estimateSchema.parse(req.body);
    const { fromLat, fromLon, toLat, toLon, seed, routeLabel, progressMinutes } = body;

    if (!isPlausibleLatLon(fromLat, fromLon) || !isPlausibleLatLon(toLat, toLon)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    const seedKey = seed ?? `${fromLat.toFixed(4)},${fromLon.toFixed(4)}|${toLat.toFixed(4)},${toLon.toFixed(4)}`;

    const straightKm = haversineDistanceKm(fromLat, fromLon, toLat, toLon);
    let distanceKm = roundDistanceKm(straightKm);

    try {
      const origin = `${fromLat},${fromLon}`;
      const destination = `${toLat},${toLon}`;
      const directions = await osmMapsService.directions(origin, destination, "driving");
      const route = directions.routes?.[0];
      const leg = route?.legs?.[0];
      const meters = Number(leg?.distance?.value ?? 0);
      if (Number.isFinite(meters) && meters > 0) {
        distanceKm = roundDistanceKm(meters / 1000);
      }
    } catch {
      // OSRM / network failure — haversine already set
    }

    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      distanceKm = Math.max(0.1, roundDistanceKm(straightKm));
    }

    const fareLKR = calculateFare(distanceKm === 0 && straightKm === 0 ? 0 : distanceKm);
    const { totalJourneyMinutes, arrivingInMinutes } = computeTripETAs({
      distanceKm,
      seed: seedKey,
      routeLabel,
      progressMinutes: progressMinutes ?? null,
    });

    res.json({
      distanceKm,
      estimatedMinutes: totalJourneyMinutes,
      arrivingInMinutes,
      fareLKR,
    });
  })
);
