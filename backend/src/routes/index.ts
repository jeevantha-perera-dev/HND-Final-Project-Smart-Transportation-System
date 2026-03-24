import { Router } from "express";
import { authRouter } from "./auth";
import { bookingRouter } from "./booking";
import { placesRouter } from "./places";
import { routingRouter } from "./routing";
import { sosRouter } from "./sos";
import { trackingRouter } from "./tracking";
import { tripsRouter } from "./trips";
import { walletRouter } from "./wallet";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/places", placesRouter);
apiRouter.use("/routing", routingRouter);
apiRouter.use("/trips", tripsRouter);
apiRouter.use("/bookings", bookingRouter);
apiRouter.use("/wallet", walletRouter);
apiRouter.use("/tracking", trackingRouter);
apiRouter.use("/sos", sosRouter);
