// src/routes/driver/withdrawalRoutes.ts

import express from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  requestWithdrawal,
  getMyWithdrawals,
} from "../../controllers/driver_app/driver.withdrawal.controller";

const router = express.Router();

router.post("/", authenticate, requestWithdrawal);

router.get("/", authenticate, getMyWithdrawals);

export default router;
