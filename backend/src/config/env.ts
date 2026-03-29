import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().catch(4000),
  APP_FIREBASE_PROJECT_ID: z.string().min(1),
  APP_FIREBASE_WEB_API_KEY: z.string().min(1),
  APP_FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  /** Path to service account JSON file (relative to backend cwd, or absolute). Preferred over inline JSON in .env */
  APP_FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  APP_FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),
  FIRESTORE_EMULATOR_HOST: z.string().optional(),
  OSM_NOMINATIM_BASE_URL: z.string().url().default("https://nominatim.openstreetmap.org"),
  OSM_PHOTON_BASE_URL: z.string().url().default("https://photon.komoot.io"),
  OSM_ROUTING_BASE_URL: z.string().url().default("https://router.project-osrm.org"),
  OSM_USER_AGENT: z
    .string()
    .default("smart-transportation-system/1.0 (contact: dev@smart-transport.local)"),
  OSM_DEFAULT_COUNTRY_CODE: z.string().default("lk"),
  OSM_HTTP_TIMEOUT_MS: z.coerce.number().default(10_000),
  OSM_CACHE_TTL_MS: z.coerce.number().default(60_000),
  OSM_RETRY_ATTEMPTS: z.coerce.number().default(2),
  OSM_RETRY_BASE_DELAY_MS: z.coerce.number().default(350),
});

export const env = envSchema.parse(process.env);
