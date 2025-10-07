// src/routes/admin/userAdminRoutes.ts

import { Router, Request, Response } from "express";
import {
  createAdminUser,
  getAllUsers,
  getUserById,
  updateAdminUser,
  updateUserAdmin,
  updateUserRole,
} from "../../controllers/admin/adminUserController";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { User } from "../../models/user";
import { getAdminStats } from "../../controllers/admin/adminUserController";
import { getDeliveryKPIs } from "../../controllers/admin/adminDeliveryController";
import { listUsersStats } from "../../models/delivery_marketplace_v1/adminUsers";

const router = Router();

router.patch("/users/:id", verifyFirebase, updateUserAdmin);

router.patch("/users/:id/role", verifyFirebase, verifyAdmin, updateUserRole);

router.get(
  "/check-role",
  verifyFirebase,
  async (req: Request, res: Response) => {
    const firebaseUser = (req as any).firebaseUser; // set by verifyFirebase
    const uid = firebaseUser?.uid; // <-- هذا هو الحقل الصحيح
    const email = firebaseUser?.email;

    if (!uid) {
      res.status(401).json({ message: "Unauthorized (no uid)" });
      return;
    }

    try {
      // ابحث بالمطابقة على firebaseUID أو البريد كخيار ثانٍ
      const user = await User.findOne({
        $or: [{ firebaseUID: uid }, { email }],
      })
        .select("role firebaseUID email")
        .lean();

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({ role: user.role });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Server error" });
    }
  }
);

router.get("/stats", verifyFirebase, verifyAdmin, getAdminStats);

router.get("/delivery/kpis", verifyFirebase, verifyAdmin, getDeliveryKPIs);

router.get("/delivery/stores/:storeId/stats", async (req, res) => {
  const storeId = req.params.storeId;

  // جلب الإحصائيات اليومية
  const dailyStats = await getStoreStats(storeId, "daily");

  // جلب الإحصائيات الأسبوعية
  const weeklyStats = await getStoreStats(storeId, "weekly");

  // جلب الإحصائيات الشهرية
  const monthlyStats = await getStoreStats(storeId, "monthly");

  res.json({
    dailyStats,
    weeklyStats,
    monthlyStats,
  });
});
router.get("/users", verifyFirebase, verifyAdmin, listUsersStats);

// إشعارات إدارية (استخدام الملف الموجود)
router.use("/notifications", verifyFirebase, verifyAdmin, require('../../routes/admin/admin.notifications.routes').default);

// مالية السائقين (استخدام الملف الموجود)
router.use("/drivers/finance", verifyFirebase, verifyAdmin, require('../../routes/admin/drivers.finance').default);

const getStoreStats = async (
  storeId: string,
  period: "daily" | "weekly" | "monthly"
) => {
  // تنفيذ الاستعلام لحساب عدد المنتجات، عدد الطلبات، والإيرادات حسب الفترة المحددة
  // هنا يمكنك استبدال الاستعلام الفعلي بناءً على الهيكل الخاص بك في قاعدة البيانات
  return {
    productsCount: 10, // قيمة افتراضية
    ordersCount: 5, // قيمة افتراضية
    totalRevenue: 100, // قيمة افتراضية
  };
};

export default router;
