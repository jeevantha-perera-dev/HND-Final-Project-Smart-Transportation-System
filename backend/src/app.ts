import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { HttpError } from "./lib/httpError";
import { apiRouter } from "./routes";

export function createApiApp() {
  const app = express();
  app.use(helmet());
  // Allow any origin during development so physical devices on Wi-Fi
  // can reach the API without being blocked by CORS.
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.use("/api/v1", apiRouter);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: "Unknown server error" });
  });

  return app;
}
