import type { AuthedRequestContext } from "./auth";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthedRequestContext;
    }
  }
}

export {};
