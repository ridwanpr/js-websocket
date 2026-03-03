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
import { createWebSocketServer } from "./websocket/wss.js";

const onSocketError = (err: ErrorEvent) => {
  console.error(err);
};

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const server = http.createServer(app);
createWebSocketServer(server);

app.use("/api", createAuthRoute());

app.listen(PORT, () => {
  console.log(`Server running on localhost:${PORT}`);
});
