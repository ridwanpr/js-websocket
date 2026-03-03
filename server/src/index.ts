import express from "express";
import cookieParser from "cookie-parser";
import http from "node:http";
import { getRandomValues } from "node:crypto";
import { WebSocketServer } from "ws";
import type { ErrorEvent } from "ws";
import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import { Buffer } from "node:buffer";
import { parseAuthHeader } from "./utils/parse-auth-header.js";
import { createAuthRoute } from "./routes/auth-route.js";

const onSocketError = (err: ErrorEvent) => {
  console.error(err);
};

const app = express();
const map = new Map();
const PORT = process.env.APP_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const server = http.createServer(app);
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

app.use("/api", createAuthRoute());

app.listen(PORT, () => {
  console.log(`Server running on localhost:${PORT}`);
});
