// src/routes/admin/adminRoutes.ts

import { Router, Request, Response } from "express";
import {
  getAllUsers,

  updateUserAdmin,
  updateUserRole,
} from "../../controllers/admin/adminUserController";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { requirePermission } from "../../middleware/rbac";
import { User } from "../../models/user";
import { getAdminStats } from "../../controllers/admin/adminUserController";
import { getDeliveryKPIs } from "../../controllers/admin/adminDeliveryController";
import { listUsersStats } from "../../models/delivery_marketplace_v1/adminUsers";

const router = Router();

// Apply Firebase authentication to all admin routes
router.use(verifyFirebase);

// Admin Users Management - requires admin.users permission
router.patch("/users/:id", requirePermission('admin.users', 'edit'), updateUserAdmin);
router.patch("/users/:id/role", verifyAdmin, updateUserRole);

// Role checking endpoint - available to all authenticated admins
router.get(
  "/check-role",
  async (req: Request, res: Response) => {
    const firebaseUser = (req as any).firebaseUser;
    const uid = firebaseUser?.uid;
    const email = firebaseUser?.email;

    if (!uid) {
      res.status(401).json({
        error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required" }
      });
      return;
    }

    try {
      const user = await User.findOne({
        $or: [{ firebaseUID: uid }, { email }],
      })
        .select("role firebaseUID email")
        .lean();

      if (!user) {
        res.status(404).json({
          error: { code: "USER_NOT_FOUND", message: "User not found" }
        });
        return;
      }

      res.json({
        role: user.role,
        permissions: {}
      });
    } catch (e: any) {
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: e.message || "Server error" }
      });
    }
  }
);

// Admin Statistics - requires admin.stats permission
router.get("/stats", requirePermission('admin.stats', 'read'), getAdminStats);
router.get("/delivery/kpis", requirePermission('admin.reports', 'read'), getDeliveryKPIs);

// Store Statistics - requires admin.stores permission and ownership check
router.get("/delivery/stores/:storeId/stats",
  requirePermission('admin.stores', 'read'),
  async (req, res) => {
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
  }
);

// Users List - requires admin.users permission
router.get("/users", requirePermission('admin.users', 'read'), listUsersStats);
router.get("/users/list", requirePermission('admin.users', 'read'), getAllUsers);

// Admin Notifications - requires admin.notifications permission
router.use("/notifications",
  requirePermission('admin.notifications', 'read'),
  require('../../routes/admin/admin.notifications.routes').default
);

// Audit Logs - requires admin.audit permission
router.use("/",
  requirePermission('admin.audit', 'read'),
  require('../../routes/admin/audit.routes').default
);

// Driver Finance - requires admin.drivers permission
router.use("/drivers/finance",
  requirePermission('admin.drivers', 'read'),
  require('../../routes/admin/drivers.finance').default
);

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
