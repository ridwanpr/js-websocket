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

      return res.json({
        message: "Login success",
        accessToken: result.accessToken,
      });
    },
  };
};
