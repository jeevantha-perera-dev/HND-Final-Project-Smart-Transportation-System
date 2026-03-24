import type { Server as SocketIOServer } from "socket.io";

type TrackingPayload = {
  tripId: string;
  latitude: number;
  longitude: number;
  speedKph?: number;
  heading?: number;
  nextStopName?: string;
  etaMinutes?: number;
  seatsAvailable?: number;
  capturedAt: string;
};

class TrackingHub {
  private io: SocketIOServer | null = null;
  private latest = new Map<string, TrackingPayload>();

  attach(io: SocketIOServer) {
    this.io = io;
  }

  publish(payload: TrackingPayload) {
    this.latest.set(payload.tripId, payload);
    this.io?.to(`trip:${payload.tripId}`).emit("tracking:update", payload);
  }

  getLatest(tripId: string) {
    return this.latest.get(tripId);
  }
}

export const trackingHub = new TrackingHub();
