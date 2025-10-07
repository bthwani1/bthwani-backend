// src/routes/topupRoutes.ts

import express from "express";
import {
  getLogsHandler,
  topupHandler,
} from "../../controllers/Wallet_V8/topupController";
import { payBillHandler } from "../../controllers/Wallet_V8/payBillController";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { TopupLog } from "../../models/Wallet_V8/TopupLog";

const router = express.Router();

router.post("/", verifyFirebase, topupHandler);

router.post("/pay-bill", verifyFirebase, payBillHandler);

router.get("/logs", getLogsHandler);

router.get("/my-logs", verifyFirebase, async (req, res) => {
  try {
    const logs = await TopupLog.find({ userId: (req as any).user.id }).sort({
      createdAt: -1,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "فشل في جلب العمليات" });
  }
});

export default router;
