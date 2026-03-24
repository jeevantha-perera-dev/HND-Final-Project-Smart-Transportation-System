import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { rateLimit } from "../lib/rateLimit";
import { osmMapsService } from "../services/googleMapsService";

const autocompleteSchema = z.object({
  input: z.string().min(1),
  sessionToken: z.string().optional(),
});

const geocodeSchema = z.object({
  address: z.string().min(2),
});

const reverseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const placesRouter = Router();
placesRouter.use(rateLimit({ windowMs: 60_000, max: 120 }));

placesRouter.get(
  "/autocomplete",
  asyncHandler(async (req, res) => {
    const payload = autocompleteSchema.parse(req.query);
    const data = await osmMapsService.autocomplete(payload.input, payload.sessionToken);
    res.json(data);
  })
);

placesRouter.get(
  "/:placeId",
  asyncHandler(async (req, res) => {
    const placeId = z.string().min(1).parse(req.params.placeId);
    const data = await osmMapsService.placeDetails(placeId);
    res.json(data);
  })
);

placesRouter.post(
  "/geocode",
  asyncHandler(async (req, res) => {
    const payload = geocodeSchema.parse(req.body);
    const data = await osmMapsService.geocode(payload.address);
    res.json(data);
  })
);

placesRouter.post(
  "/reverse-geocode",
  asyncHandler(async (req, res) => {
    const payload = reverseSchema.parse(req.body);
    const data = await osmMapsService.reverseGeocode(payload.latitude, payload.longitude);
    res.json(data);
  })
);
