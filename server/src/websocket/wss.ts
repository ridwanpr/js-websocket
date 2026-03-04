import { IncomingMessage, type Server } from "node:http";
import type { Socket } from "node:net";
import type { Buffer } from "node:buffer";
import WebSocket, { WebSocketServer } from "ws";
import { parseCookie } from "cookie";
import { createHash } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import type { Session } from "../generated/prisma/client.js";

export const createWebSocketServer = (server: Server) => {
  const connectedUser = new Map();
  const wss = new WebSocketServer({ noServer: true });

  server.on(
    "upgrade",
    async (request: IncomingMessage, socket: Socket, head: Buffer) => {
      const token = getAccessToken(request);
      if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const userSession = await resolveUserSession(token);
      if (!userSession) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request, userSession);
      });

      wss.on(
        "connection",
        (ws: WebSocket, request: IncomingMessage, userSession: Session) => {
          connectedUser.set(userSession.user_id, ws);

          ws.on("error", console.error);
          ws.on("message", (message) => {
            console.log(
              `Received message ${message} from user ${userSession.user_id}`,
            );

            ws.send("Hello from server");
          });
          ws.on("close", () => {
            connectedUser.delete(userSession.user_id);
          });
        },
      );
    },
  );

  return wss;
};

const getAccessToken = (request: IncomingMessage): string | undefined => {
  const rawCookies = request.headers.cookie;
  if (rawCookies) {
    const token = parseCookie(rawCookies).accessToken;
    if (token) return token;
  }

  // fallback for api testing (bruno/postman)
  // use ws://localhost:3000?token=value
  const url = new URL(request.url!, "http://localhost");
  return url.searchParams.get("token") ?? undefined;
};

const resolveUserSession = async (token: string): Promise<Session | null> => {
  const hashedToken = createHash("sha256").update(token).digest("hex");

  const userSession = await prisma.session.findFirst({
    where: {
      token: hashedToken,
    },
  });

  if (
    !userSession ||
    userSession.is_revoked ||
    userSession.expires_at < new Date()
  ) {
    return null;
  }

  return userSession;
};
