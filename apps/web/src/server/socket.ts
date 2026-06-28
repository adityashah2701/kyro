import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketIOServer | undefined;

export function initSocket(server: HTTPServer) {
  if (!io) {
    io = new SocketIOServer(server, {
      cors: {
        origin: "*", // Adjust this for production!
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io has not been initialized");
  }
  return io;
}
