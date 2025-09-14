// src/routes/Wallet_V8/walletOrderRoutes.ts
import express from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import {
  holdFunds,
  captureHold,
  releaseHold,
} from "../../controllers/Wallet_V8/orderFunds.controller";

const router = express.Router();
router.use(verifyFirebase);

router.post("/hold", holdFunds); // /api/v1/wallet/order/hold
router.post("/capture", captureHold); // /api/v1/wallet/order/capture
router.post("/release", releaseHold); // /api/v1/wallet/order/release

export default router;
