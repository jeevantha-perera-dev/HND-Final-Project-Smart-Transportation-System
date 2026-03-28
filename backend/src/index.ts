import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createApiApp } from "./app";
import "./config/env";
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

const port = Number(process.env.PORT) || 4000;

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error("Port is already in use. Please kill the process or change the PORT in .env.");
    process.exit(1);
  }
  throw error;
});

server.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

async function shutdown() {
  server.close();
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
