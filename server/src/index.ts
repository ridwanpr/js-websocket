import express from "express";
import cookieParser from "cookie-parser";
import http from "node:http";
import { createAuthRoute } from "./routes/auth-route.js";
import { createWebSocketServer } from "./websocket/wss.js";

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
