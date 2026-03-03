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
  };
};
