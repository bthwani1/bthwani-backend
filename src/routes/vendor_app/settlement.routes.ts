// src/routes/vendor_app/settlement.routes.ts
import { Router } from "express";
import * as controller from "../../controllers/vendor_app/settlement.controller";
import { verifyVendorJWT } from "../../middleware/verifyVendorJWT";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";

const router = Router();

// مسارات التاجر (Vendor Routes) - محمية بـ JWT التاجر
router.use(verifyVendorJWT);

// إنشاء طلب تسوية جديد
router.post("/", controller.createSettlementRequest);

// جلب جميع طلبات التسوية الخاصة بالتاجر
router.get("/", controller.getMySettlementRequests);

// جلب تفاصيل طلب تسوية محدد
router.get("/:id", controller.getSettlementRequestById);

// إلغاء طلب تسوية (فقط إذا كان pending)
router.patch("/:id/cancel", controller.cancelSettlementRequest);

// جلب الرصيد المتاح للتاجر
router.get("/balance/me", controller.getMyBalance);

// مسارات الإدارة (Admin Routes) - محمية بصلاحيات الإدارة
router.use(verifyFirebase);
router.use(verifyAdmin);

// جلب جميع طلبات التسوية (للإدارة) مع فلترة وباجينيشن
router.get("/admin/all", controller.getAllSettlementRequests);

// تحديث حالة طلب التسوية (للإدارة)
router.patch("/admin/:id/status", controller.updateSettlementStatus);

export default router;
