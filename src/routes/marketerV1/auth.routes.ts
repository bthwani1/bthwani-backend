// src/routes/marketing/auth.routes.ts
import { Router } from "express";
import {
  marketerLogin,
  me,
} from "../../controllers/marketer_v1/auth.controller";
import { verifyMarketerJWT } from "../../middleware/verifyMarketerJWT";

const router = Router();

/**
 * POST /auth/marketer-login
 * body: { email?: string, phone?: string, password: string }
 * resp: { token, user }
 */
router.post("/marketer-login", marketerLogin);
router.get("/me", verifyMarketerJWT, me);

export default router;
