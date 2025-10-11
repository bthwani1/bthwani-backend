// src/routes/admin/adminManagementRoutes.ts
// واجهة محسنة لإدارة المشرفين

import { Router, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import {
  registerAdmin,
  loginAdmin,
  getAdmins,
  getAdminById,
  updatePermissions,
  updateAdmin,
  updateAdminStatus,
  deleteAdmin,
} from "../../controllers/admin/adminUsersController";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { audit } from "../../middleware/audit";
import { bruteForceProtection } from "../../middleware/bruteForceProtection";
import passwordSecurityRoutes from "./passwordSecurityRoutes";
import { ModuleName, AdminRole, AdminUser } from "../../models/admin/AdminUser";

const router = Router();

// Middleware للتحقق من صحة البيانات
// بدّل الدالة كلها بهذا الشكل:
const handleValidationErrors = (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "خطأ في البيانات المدخلة",
        errors: errors.array(),
      });
    }
    return next();
  };
  

// 1. إنشاء مشرف جديد
router.post(
  "/create",
  verifyFirebase,
  verifyAdmin,
  audit("admin:createAdmin"),
  [
    body("username")
      .isLength({ min: 3, max: 50 })
      .withMessage("اسم المستخدم يجب أن يكون بين 3 و 50 حرف")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("اسم المستخدم يجب أن يحتوي على أحرف وأرقام وشرطة سفلية فقط"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم"),
    body("roles")
      .optional()
      .isArray()
      .withMessage("الأدوار يجب أن تكون مصفوفة"),
    body("permissions")
      .optional()
      .isObject()
      .withMessage("الصلاحيات يجب أن تكون object"),
  ],
  handleValidationErrors,
  registerAdmin
);

// 2. تسجيل دخول المشرف
router.post(
  "/login",
  bruteForceProtection,
  [
    body("username").notEmpty().withMessage("اسم المستخدم مطلوب"),
    body("password").notEmpty().withMessage("كلمة المرور مطلوبة"),
  ],
  handleValidationErrors,
  loginAdmin
);

// 3. قائمة جميع المشرفين
router.get(
  "/list",
  verifyFirebase,
  verifyAdmin,
  getAdmins
);

// 4. تفاصيل مشرف محدد
router.get(
  "/:id",
  verifyFirebase,
  verifyAdmin,
  [param("id").isMongoId().withMessage("معرف المشرف غير صحيح")],
  handleValidationErrors,
  getAdminById
);

// 5. تحديث صلاحيات مشرف
router.put(
  "/:id/permissions",
  verifyFirebase,
  verifyAdmin,
  audit("admin:updatePermissions"),
  [
    param("id").isMongoId().withMessage("معرف المشرف غير صحيح"),
    body("permissions")
      .isObject()
      .withMessage("الصلاحيات يجب أن تكون object")
      .custom((permissions: any) => {
        const validModules = Object.values(ModuleName) as string[];
        const permissionKeys = Object.keys(permissions);
        return permissionKeys.every(key => validModules.includes(key as ModuleName));
      })
      .withMessage("أسماء الأقسام في الصلاحيات غير صحيحة"),
  ],
  handleValidationErrors,
  updatePermissions
);

// 6. تحديث بيانات مشرف
router.put(
  "/:id",
  verifyFirebase,
  verifyAdmin,
  audit("admin:updateAdmin"),
  [
    param("id").isMongoId().withMessage("معرف المشرف غير صحيح"),
    body("username").optional().isLength({ min: 3, max: 50 }),
    body("roles").optional().isArray(),
    body("isActive").optional().isBoolean(),
  ],
  handleValidationErrors,
  updateAdmin
);

// 7. تفعيل/تعطيل مشرف
router.patch(
  "/:id/status",
  verifyFirebase,
  verifyAdmin,
  audit("admin:updateAdminStatus"),
  [
    param("id").isMongoId().withMessage("معرف المشرف غير صحيح"),
    body("isActive").isBoolean().withMessage("حالة التفعيل يجب أن تكون true أو false"),
  ],
  handleValidationErrors,
  updateAdminStatus
);

// 8. حذف مشرف
router.delete(
  "/:id",
  verifyFirebase,
  verifyAdmin,
  audit("admin:deleteAdmin"),
  [param("id").isMongoId().withMessage("معرف المشرف غير صحيح")],
  handleValidationErrors,
  deleteAdmin
);

// 9. إحصائيات المشرفين
router.get(
  "/stats/summary",
  verifyFirebase,
  verifyAdmin,
  async (req: Request, res: Response) => {
    try {
      const totalAdmins = await require("../../models/admin/AdminUser").AdminUser.countDocuments();
      const activeAdmins = await require("../../models/admin/AdminUser").AdminUser.countDocuments({ isActive: true });
      const superAdmins = await require("../../models/admin/AdminUser").AdminUser.countDocuments({
        roles: AdminRole.SUPERADMIN
      });

      res.json({
        total: totalAdmins,
        active: activeAdmins,
        inactive: totalAdmins - activeAdmins,
        superAdmins: superAdmins,
      });
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الإحصائيات" });
    }
  }
);
// يعيد بيانات الأدمن الحالي
router.get(
    "/me",
    verifyFirebase,
    verifyAdmin,
    async (req: Request, res: Response) => {
      try {
        // عدّل طريقة الجلب حسب ما يحفظه verifyAdmin:
        // لو تحفظ الـ uid أو الإيميل في req.user:
        const userRef = (req as any).user?.email || (req as any).user?.uid;
        const admin =
          (await AdminUser.findOne({ username: userRef }).select("-password")) ||
          (await AdminUser.findById((req as any).user?.adminId).select("-password"));
  
        if (!admin) {
            res.status(404).json({ message: "Admin not found" });
            return;
        } 
  
         res.json({
          data: {
            _id: String(admin._id),
            name: admin.username, // مؤقتًا نعرض username كاسم
            email: admin.username, // لو username = الإيميل لديك
            role: admin.roles?.[0] ?? "admin",
            status: admin.isActive ? "active" : "disabled",
            capabilities: Object.fromEntries(
              Array.from((admin.permissions || new Map()).entries()).map(([k, v]: any) => [
                k,
                {
                  view: !!v.view,
                  create: !!v.create,
                  edit: !!v.edit,
                  delete: !!v.delete,
                  approve: !!v.approve,
                  export: !!v.export,
                },
              ])
            ),
          },
        });
        return;
      } catch (e) {
         res.status(500).json({ message: "Server error" });
         return;
      }
    }
  );
  
  // يعيد قائمة الوحدات/الصلاحيات المتاحة
  router.get(
    "/modules",
    verifyFirebase,
    verifyAdmin,
    async (_req: Request, res: Response) => {
      const modules = Object.values(ModuleName).map((name) => ({
        name,
        label: name, // غيّرها لعناوين عربية لاحقًا
        actions: ["view", "create", "edit", "delete", "approve", "export"],
      }));
       res.json({ data: modules });
       return;
    }
  );

  // مراقبة حالة الحماية من المحاولات المتكررة
  router.get(
    "/security/brute-force-status",
    verifyFirebase,
    verifyAdmin,
    async (req: Request, res: Response) => {
      try {
        const LoginAttempt = require("../../models/LoginAttempt").default;

        // إحصائيات عامة
        const totalAttempts = await LoginAttempt.countDocuments();
        const blockedAccounts = await LoginAttempt.countDocuments({ blockedUntil: { $gt: new Date() } });
        const recentAttempts = await LoginAttempt.countDocuments({
          lastAttempt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // آخر 24 ساعة
        });

        // قائمة المحاولات الأخيرة
        const recentFailedAttempts = await LoginAttempt.find({
          lastAttempt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // آخر ساعة
        })
        .sort({ lastAttempt: -1 })
        .limit(50)
        .select('ip username email attempts lastAttempt blockedUntil');

        res.json({
          summary: {
            totalAttempts,
            blockedAccounts,
            recentAttempts,
            activeThreats: blockedAccounts
          },
          recentAttempts: recentFailedAttempts.map((attempt: any) => ({
            ip: attempt.ip,
            identifier: attempt.username || attempt.email || 'غير محدد',
            attempts: attempt.attempts,
            lastAttempt: attempt.lastAttempt,
            isBlocked: attempt.isBlocked,
            remainingBlockTime: attempt.blockedUntil ?
              Math.ceil((attempt.blockedUntil.getTime() - Date.now()) / 1000 / 60) : 0
          }))
        });
      } catch (error) {
        console.error('Error fetching brute force status:', error);
        res.status(500).json({ message: "خطأ في جلب حالة الحماية" });
      }
    }
  );

  // تشغيل تنظيف الحسابات والصلاحيات
  router.post(
    "/cleanup/accounts",
    verifyFirebase,
    verifyAdmin,
    async (req: Request, res: Response) => {
      try {
        // التحقق من أن المستخدم SuperAdmin
        const userRole = (req as any).user?.roles?.[0];
        if (userRole !== 'SUPERADMIN') {
           res.status(403).json({
            message: "هذا الإجراء متاح لمديري النظام العامين فقط",
            error: "UNAUTHORIZED"
          });
          return;
        }

        const { cleanupUnusedAccounts } = await import("../../scripts/cleanup-unused-accounts");
        const results = await cleanupUnusedAccounts();

        res.json({
          message: "تم تشغيل عملية التنظيف بنجاح",
          results,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Error running account cleanup:', error);
        res.status(500).json({ message: "خطأ في تشغيل عملية التنظيف" });
      }
    }
  );

// استخدام routes أمان كلمات المرور والـ 2FA
router.use('/password-security', passwordSecurityRoutes);

export default router;
