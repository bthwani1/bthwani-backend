// routes/admin/adminUsersRoutes.ts

import { Router } from "express";
import { body, param } from "express-validator";
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
import { requirePermission } from "../../middleware/rbac";
import { ModuleName } from "../../models/admin/AdminUser";

const router = Router();
const allowedModules = Object.values(ModuleName) as string[];

// Apply Firebase authentication to all admin user routes
router.use(verifyFirebase);

// 1. Register a new admin - requires admin.users:write permission
router.post(
  "/register",
  requirePermission('admin.users', 'write'),
  [
    body("name").isString().notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("roles").isArray().optional(),
    body("permissions").isObject().optional(),
  ],
  registerAdmin
);

// 2. Login an admin - public endpoint (but still requires Firebase auth)
router.post(
  "/login",
  [body("email").isEmail(), body("password").isString().notEmpty()],
  loginAdmin
);

// 3. Get list of all admins - requires admin.users:read permission
router.get("/", requirePermission('admin.users', 'read'), getAdmins);

// 4. Get admin by ID - requires admin.users:read permission
router.get("/:id", requirePermission('admin.users', 'read'), [param("id").isMongoId()], getAdminById);

// 5. Update admin - requires admin.users:edit permission
router.put("/:id", requirePermission('admin.users', 'edit'), [param("id").isMongoId()], updateAdmin);

// 6. Update admin status (activate/deactivate) - requires admin.users:edit permission
router.patch(
  "/:id/status",
  requirePermission('admin.users', 'edit'),
  [
    param("id").isMongoId(),
    body("isActive").isBoolean(),
  ],
  updateAdminStatus
);

// 7. Update permissions for a given admin - requires admin.users:edit permission
router.put(
  "/:id/permissions",
  requirePermission('admin.users', 'edit'),
  [
    param("id").isMongoId(),
    body("permissions")
      .isObject()
      .custom((perms: any) => {
        return Object.keys(perms).every((k) => allowedModules.includes(k));
      })
      .withMessage("Invalid module in permissions"),
  ],
  updatePermissions
);

// 8. Delete admin - requires admin.users:delete permission
router.delete("/:id", requirePermission('admin.users', 'delete'), [param("id").isMongoId()], deleteAdmin);

export default router;
