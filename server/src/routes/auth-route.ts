import { Router } from "express";
import { parseDTO } from "../middleware/parse-dto.js";
import { registerDTO } from "../dto/auth/register-dto.js";
import { authController } from "../controllers/auth-controller.js";
import { createAuthService } from "../services/auth-service.js";

export const createAuthRoute = () => {
  const router = Router();

  const service = createAuthService();
  const controller = authController(service);

  router.post("/auth/register", parseDTO(registerDTO), controller.register);

  return router;
};
