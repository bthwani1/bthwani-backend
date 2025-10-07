// routes/adminRoutes.ts

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

import { ModuleName } from "../../models/admin/AdminUser";

const router = Router();
const allowedModules = Object.values(ModuleName) as string[];

// 1. Register a new admin
router.post(
  "/register",
  [
    body("name").isString().notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("roles").isArray().optional(),
    body("permissions").isObject().optional(),
    // we’ll trust controller to filter ModuleName keys
  ],
  registerAdmin
);

// 2. Login an admin
router.post(
  "/login",
  [body("email").isEmail(), body("password").isString().notEmpty()],
  loginAdmin
);

// 3. Get list of all admins
router.get("/", getAdmins);

// 4. Get admin by ID
router.get("/:id", [param("id").isMongoId()], getAdminById);

// 5. Update admin
router.put("/:id", [param("id").isMongoId()], updateAdmin);

// 6. Update admin status (activate/deactivate)
router.patch(
  "/:id/status",
  [
    param("id").isMongoId(),
    body("isActive").isBoolean(),
  ],
  updateAdminStatus
);

// 7. Update permissions for a given admin
router.put(
  "/:id/permissions",
  [
    param("id").isMongoId(),
    body("permissions")
      .isObject()
      .custom((perms: any) => {
        // كل مفتاح يجب أن يكون من ModuleName
        return Object.keys(perms).every((k) => allowedModules.includes(k));
      })
      .withMessage("Invalid module in permissions"),
  ],
  updatePermissions
);

// 8. Delete admin
router.delete("/:id", [param("id").isMongoId()], deleteAdmin);

export default router;
