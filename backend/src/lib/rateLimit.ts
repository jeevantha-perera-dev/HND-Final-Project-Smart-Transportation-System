import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./httpError";

type Counter = {
  count: number;
  resetAt: number;
};

const counters = new Map<string, Counter>();

export function rateLimit(options: { windowMs: number; max: number }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const current = counters.get(key);
    if (!current || current.resetAt <= now) {
      counters.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }
    if (current.count >= options.max) {
      return next(new HttpError(429, "Too many requests, try again later"));
    }
    current.count += 1;
    counters.set(key, current);
    return next();
  };
}
