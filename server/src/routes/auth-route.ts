import { Router } from "express";
import { parseDTO } from "../middleware/parse-dto.js";
import { registerDTO } from "../dto/auth/register-dto.js";
import { authController } from "../controllers/auth-controller.js";
import { createAuthService } from "../services/auth-service.js";
import { loginDTO } from "../dto/auth/login-dto.js";
import { validateToken } from "../middleware/validate-token.js";

export const createAuthRoute = () => {
  const router = Router();

  const service = createAuthService();
  const controller = authController(service);

  router.post("/auth/register", parseDTO(registerDTO), controller.register);
  router.post("/auth/login", parseDTO(loginDTO), controller.login);

  router.get("/auth/me", validateToken, (_req, res) => {
    return res.json({
      message: "Fetch user info success",
    });
  });

  return router;
};
