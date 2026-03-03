import { WebSocketServer } from "ws";
import type { ErrorEvent } from "ws";
import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import { Buffer } from "node:buffer";
import type { Server } from "node:http";
import { parseAuthHeader } from "../utils/parse-auth-header.js";

const onSocketError = (err: ErrorEvent) => {
  console.error(err);
};

const map = new Map();

export const createWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({ port: 8080 });

  server.on(
    "upgrade",
    (request: IncomingMessage, socket: Socket, head: Buffer) => {
      socket.on("error", onSocketError);

      const authHeader = request.headers.authorization;
      if (!authHeader) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      socket.removeListener("error", onSocketError);

      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.emit("connection", ws, request);
      });
    },
  );

  wss.on("connection", (ws, request) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new Error("Unauthorized");

    const userId = parseAuthHeader(authHeader);

    map.set(userId, ws);

    ws.on("error", console.error);

    ws.on("message", (message) => {
      console.log(`Received message ${message} from user ${userId}`);
    });

    ws.on("close", () => {
      map.delete(userId);
    });
  });

  return wss;
};
