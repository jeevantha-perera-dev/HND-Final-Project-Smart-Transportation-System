import { onRequest } from "firebase-functions/v2/https";
import { createApiApp } from "./app";

const app = createApiApp();

export const api = onRequest({ cors: true }, app);
