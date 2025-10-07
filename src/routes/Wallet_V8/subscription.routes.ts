// src/routes/subscriptionRoutes.ts

import express from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import {
  createSubscription,
  getMySubscription,
} from "../../controllers/Wallet_V8/subscription.controller";

const router = express.Router();

router.get("/my", verifyFirebase, getMySubscription);

router.post("/", verifyFirebase, createSubscription);

export default router;
