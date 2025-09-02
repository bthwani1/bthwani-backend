// routes/promotion.routes.ts
import { Router } from "express";
import {
  createPromotion,
  getActivePromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
} from "../../controllers/delivry_Marketplace_V1/promotion.controller";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";

const router = Router();

// لا يحتاج توثيق للحصول على العروض
router.get("/", getActivePromotions);
router.get("/:id", getPromotionById);

// CRUD للمسؤولين فقط
router.post("/", verifyFirebase, verifyAdmin, createPromotion);
router.put("/:id", verifyFirebase, verifyAdmin, updatePromotion);
router.delete("/:id", verifyFirebase, verifyAdmin, deletePromotion);

export default router;
