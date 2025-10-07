// src/routes/couponRoutes.ts

import express from "express";

import {
  createCoupon,
  validateCoupon,
  markCouponAsUsed,
  redeemPoints,
} from "../../controllers/Wallet_V8/coupon.controller";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { Coupon } from "../../models/Wallet_V8/coupon.model";

const router = express.Router();

router.post("/", verifyAdmin, createCoupon);

router.post("/validate", verifyFirebase, validateCoupon);

router.post("/use", verifyFirebase, markCouponAsUsed);

router.get("/user", verifyFirebase, async (req, res) => {
  const userId = (req.user as any).id;
  const coupons = await Coupon.find({
    $and: [
      { expiryDate: { $gte: new Date() } },
      { $or: [{ assignedTo: userId }, { assignedTo: null }] },
      { $expr: { $lt: ["$usedCount", { $ifNull: ["$usageLimit", 1] }] } }, // 👈 بدل usedCount: {$lt: "$usageLimit"}
    ],
  });
  res.json(coupons);
});

router.post("/redeem", verifyFirebase, redeemPoints);

export default router;
