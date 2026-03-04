import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import http from "node:http";
import cors from "cors";
import { createAuthRoute } from "./routes/auth-route.js";
import { createWebSocketServer } from "./websocket/wss.js";
import { productEventEmitter } from "./lib/event-emitter.js";

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const server = http.createServer(app);
createWebSocketServer(server);

app.use("/api", createAuthRoute());

// server sent events
const colors = ["red", "green", "blue", "yellow", "pink", "purple"];

const getRandomColor = () => {
  return colors[Math.floor(Math.random() * colors.length)];
};

app.get("/current-time", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const intervalId = setInterval(() => {
    res.write(`data: ${new Date().toLocaleTimeString()}\n\n`);
    res.write(`event: color\ndata: ${getRandomColor()}\n\n`);
  }, 1000);

  res.on("close", () => {
    clearInterval(intervalId);
  });
});

app.get("/listen-product", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const listener = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}`);
  };

  productEventEmitter.on("product_change", listener);

  req.on("close", () => {
    productEventEmitter.off("product_change", listener);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on PORT:${PORT}`);
});
