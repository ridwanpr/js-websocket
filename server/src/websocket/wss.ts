import { IncomingMessage, type Server } from "node:http";
import type { Socket } from "node:net";
import type { Buffer } from "node:buffer";
import WebSocket, { WebSocketServer } from "ws";
import { parseCookie } from "cookie";
import { createHash } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import type { Session } from "../generated/prisma/client.js";
import { addProduct } from "./action/add-product.js";
import z, { ZodError } from "zod";
import { zParseDTO } from "../lib/zod.js";
import { addProductDTO } from "./dto/add-product.dto.js";
import { listProduct } from "./action/list-product.js";

export const createWebSocketServer = (server: Server) => {
  const connectedUser = new Map<bigint, Set<WebSocket>>();
  const productSubscribers = new Set<bigint>();
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
    },
  );

  wss.on(
    "connection",
    (ws: WebSocket, _request: IncomingMessage, userSession: Session) => {
      if (!connectedUser.has(userSession.user_id)) {
        connectedUser.set(userSession.user_id, new Set());
      }
      connectedUser.get(userSession.user_id)!.add(ws);

      ws.on("error", console.error);

      ws.on("message", async (rawMessage) => {
        try {
          const message = JSON.parse(rawMessage.toString());

          switch (message.action) {
            case "SUBSCRIBE_PRODUCT":
              productSubscribers.add(userSession.user_id);
              ws.send(
                JSON.stringify({ message: "Subscribed to product updates" }),
              );
              break;
            case "UNSUBSCRIBE_PRODUCT":
              productSubscribers.delete(userSession.user_id);
              ws.send(
                JSON.stringify({
                  message: "Unsubscribed from product updates",
                }),
              );
              break;
            case "ADD_PRODUCT":
              const validatedMessage = await zParseDTO(
                addProductDTO,
                message.payload,
              );
              const addProductResult = await addProduct(validatedMessage);
              ws.send(
                JSON.stringify({
                  message: "Add product success",
                  data: serializeBigInt(addProductResult),
                }),
              );

              // get updated product list and broadcast to all subscribers
              const updatedList = await listProduct();
              const broadcast = JSON.stringify({
                event: "PRODUCT_LIST_UPDATED",
                data: serializeBigInt(updatedList),
              });

              for (const userId of productSubscribers) {
                const sockets = connectedUser.get(userId);
                if (!sockets) continue;
                for (const socket of sockets) {
                  if (socket.readyState === WebSocket.OPEN) {
                    socket.send(broadcast);
                  }
                }
              }
              return;
            case "LIST_PRODUCT":
              const listProductResult = await listProduct();
              ws.send(
                JSON.stringify({
                  message: "Fetch product success",
                  data: serializeBigInt(listProductResult),
                }),
              );
              return;
            default:
              ws.send(
                JSON.stringify({
                  error: "UNKNOWN_ACTION",
                  message: `Action ${message.action} is not supported.`,
                }),
              );
              return;
          }
        } catch (err) {
          if (err instanceof ZodError) {
            ws.send(
              JSON.stringify({
                code: "VALIDATION_ERROR",
                message: "Invalid input data",
                errors: z.flattenError(err),
              }),
            );
            return;
          }

          ws.send(
            JSON.stringify({
              code: "SERVER_ERROR",
              message: err instanceof Error ? err.message : "Unknown error",
            }),
          );
        }
      });
      
      ws.on("close", () => {
        const userSockets = connectedUser.get(userSession.user_id);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) connectedUser.delete(userSession.user_id);
        }
        productSubscribers.delete(userSession.user_id);
      });
    },
  );

  return wss;
};

const serializeBigInt = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );

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
