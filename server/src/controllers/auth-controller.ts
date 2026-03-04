import type { Request, Response } from "express";
import type { AuthService } from "../services/auth-service.js";

export const authController = (authService: AuthService) => {
  return {
    async register(req: Request, res: Response) {
      const result = await authService.register(req.body);

      return res.json({
        message: "Register success",
        data: { ...result, id: result.id.toString() },
      });
    },

    async login(req: Request, res: Response) {
      const result = await authService.login(req.body);

      res.cookie("accessToken", result.accessToken, {
        sameSite: "lax",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: process.env.NODE_ENV === "production",
      });

      return res.json({
        message: "Login success",
      });
    },
  };
};
