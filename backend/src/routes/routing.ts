import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { rateLimit } from "../lib/rateLimit";
import { osmMapsService } from "../services/googleMapsService";

const routingOptionsSchema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  preference: z.enum(["fastest", "least_walking", "cheapest"]).default("fastest"),
});

const matrixSchema = z.object({
  origins: z.array(z.string().min(1)).min(1),
  destinations: z.array(z.string().min(1)).min(1),
  mode: z.enum(["walking", "driving"]).default("walking"),
});

const snapSchema = z.object({
  path: z.array(z.object({ latitude: z.number(), longitude: z.number() })).min(2),
});

export const routingRouter = Router();
routingRouter.use(rateLimit({ windowMs: 60_000, max: 120 }));

routingRouter.post(
  "/options",
  asyncHandler(async (req, res) => {
    const payload = routingOptionsSchema.parse(req.body);
    const mode = payload.preference === "least_walking" ? "walking" : "driving";
    const directions = await osmMapsService.directions(payload.origin, payload.destination, mode);
    res.json({
      preference: payload.preference,
      directions,
    });
  })
);

routingRouter.post(
  "/walking-distance",
  asyncHandler(async (req, res) => {
    const payload = matrixSchema.parse(req.body);
    const result = await osmMapsService.distanceMatrix(
      payload.origins.join("|"),
      payload.destinations.join("|"),
      payload.mode
    );
    res.json(result);
  })
);

routingRouter.post(
  "/polyline",
  asyncHandler(async (req, res) => {
    const payload = routingOptionsSchema.parse(req.body);
    const directions = await osmMapsService.directions(payload.origin, payload.destination, "driving");
    res.json(directions);
  })
);

routingRouter.post(
  "/roads/snap",
  asyncHandler(async (req, res) => {
    const payload = snapSchema.parse(req.body);
    const path = payload.path.map((p) => `${p.latitude},${p.longitude}`).join("|");
    const result = await osmMapsService.snapToRoad(path);
    res.json(result);
  })
);
