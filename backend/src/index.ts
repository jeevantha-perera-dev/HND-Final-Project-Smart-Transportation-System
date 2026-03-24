import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createApiApp } from "./app";
import { env } from "./config/env";
import { trackingHub } from "./services/trackingHub";

const app = createApiApp();

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
  },
});

trackingHub.attach(io);

io.on("connection", (socket) => {
  socket.on("tracking:join", ({ tripId }: { tripId: string }) => {
    socket.join(`trip:${tripId}`);
  });

  socket.on("tracking:leave", ({ tripId }: { tripId: string }) => {
    socket.leave(`trip:${tripId}`);
  });
});

server.listen(env.PORT, () => {
  console.log(`Backend listening on port ${env.PORT}`);
});

async function shutdown() {
  server.close();
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
