// routes/promotion.routes.ts
import { Router } from "express";
import {
  createPromotion,
  getActivePromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  getPromotionsByStores,
  getPromotionsByProducts,
  getAllPromotionsAdmin,
} from "../../controllers/delivery_marketplace_v1/promotion.controller";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";

const router = Router();

// لا يحتاج توثيق للحصول على العروض
router.get("/", getActivePromotions); // ✅ بدل الهاندلر اليدوي الخاطئ
router.get("/by-stores", getPromotionsByStores);
router.get("/by-products", getPromotionsByProducts);
router.get("/:id", getPromotionById);
router.get("/admin", verifyFirebase, verifyAdmin, getAllPromotionsAdmin);

router.post("/", verifyFirebase, verifyAdmin, createPromotion);
router.put("/:id", verifyFirebase, verifyAdmin, updatePromotion);
router.delete("/:id", verifyFirebase, verifyAdmin, deletePromotion);

export default router;
