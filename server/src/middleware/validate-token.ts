import type { NextFunction, Request, Response } from "express";
import { createHash } from "node:crypto";
import { prisma } from "../lib/prisma.js";

export const validateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.sendStatus(401);
  }

  const hashedToken = createHash("sha256").update(token).digest("hex");

  const userSession = await prisma.session.findFirst({
    where: {
      token: hashedToken,
    },
  });

  if (
    !userSession ||
    userSession.expires_at < new Date() ||
    userSession.is_revoked
  ) {
    return res.sendStatus(401);
  }

  next();
};
