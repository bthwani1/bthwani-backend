// routes/adminRoutes.ts

import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  registerAdmin,
  loginAdmin,
  getAdmins,
  updatePermissions,
} from '../../controllers/admin/adminUsersController';
import { authenticateJWT } from '../../middleware/authMiddleware';
import { authorize } from '../../middleware/permissionMiddleware';
import { ModuleName } from '../../models/admin/AdminUser';

const router = Router();
const allowedModules = Object.values(ModuleName) as string[];

// 1. Register a new admin
router.post(
  '/register',
  authenticateJWT,                      // only super-admins can create new admins
  authorize('admin', 'create'),        // example: require 'create' on 'admin' module
  [
    body('name').isString().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('roles').isArray().optional(),
    body('permissions').isObject().optional(),
    // we’ll trust controller to filter ModuleName keys
  ],
  registerAdmin
);

// 2. Login an admin
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').isString().notEmpty(),
  ],
  loginAdmin
);

// 3. Get list of all admins
router.get(
  '/',
  authenticateJWT,
  authorize('admin', 'view'),
  getAdmins
);

// 4. Update permissions for a given admin
router.put(
  '/:id/permissions',
  authenticateJWT,
  authorize(ModuleName.Admin /* ← افترضت وجود هذا الدور */, 'edit'),
  [
    param('id').isMongoId(),
    body('permissions')
      .isObject()
      .custom((perms: any) => {
        // كل مفتاح يجب أن يكون من ModuleName
        return Object.keys(perms).every(k => allowedModules.includes(k));
      })
      .withMessage('Invalid module in permissions'),
  ],
  updatePermissions
);

export default router;
