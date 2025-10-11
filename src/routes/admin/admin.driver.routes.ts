// src/routes/admin/driverAdminRoutes.ts

import express from "express";
import {
  createDriver,
  listDrivers,
  resetPassword,
  searchDrivers,
  setJokerStatus,
  toggleBan,
  updateWallet,
  verifyDriver,
} from "../../controllers/admin/admin.driver.controller";
import {
  confirmTransferToUser,
  initiateTransferToUser,
  updateJokerWindow,
} from "../../controllers/driver_app/driver.controller";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import {
  approveVacation,
  getActiveDriversCount,
} from "../../controllers/driver_app/vacation.controller";
import { verifyAdmin } from "../../middleware/verifyAdmin";

const router = express.Router();

router.post(
  "/create",
  verifyFirebase,
  verifyAdmin,
  createDriver
);

router.put(
  "/joker",
  verifyFirebase,
  verifyAdmin,
  setJokerStatus
);

router.patch(
  "vacations/:id/approve",
  verifyFirebase,
  verifyAdmin,
  approveVacation
);

router.get(
  "/active/count",
  verifyFirebase,
  verifyAdmin,
  getActiveDriversCount
);

router.get(
  "/search",
  verifyFirebase,
  verifyAdmin,
  searchDrivers
);

/**
 * @swagger
 * /api/v1/admin/drivers:
 *   get:
 *     summary: جلب قائمة السائقين مع فلترة وتصفح
 *     description: يعيد قائمة السائقين مع دعم البحث والتصفح والفلترة
 *     tags: [Admin, Drivers]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: نص البحث في اسم السائق أو رقم الهاتف
 *         example: محمد
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: رقم الصفحة
 *         example: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: عدد العناصر في الصفحة
 *         example: 20
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [rider_driver, light_driver, women_driver]
 *         description: فلترة حسب دور السائق
 *         example: rider_driver
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: فلترة حسب حالة التوفر
 *         example: true
 *     responses:
 *       200:
 *         description: قائمة السائقين بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     drivers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60f1b2b3c4d5e6f7g8h9i0j1
 *                           fullName:
 *                             type: string
 *                             example: أحمد محمد
 *                           phone:
 *                             type: string
 *                             example: "+966501234567"
 *                           role:
 *                             type: string
 *                             enum: [rider_driver, light_driver, women_driver]
 *                             example: rider_driver
 *                           vehicleType:
 *                             type: string
 *                             enum: [motor, bike, car]
 *                             example: motor
 *                           isAvailable:
 *                             type: boolean
 *                             example: true
 *                           isVerified:
 *                             type: boolean
 *                             example: true
 *                           isBanned:
 *                             type: boolean
 *                             example: false
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  verifyFirebase,
  verifyAdmin,
  listDrivers
);
router.patch(
  "/:id/block",
  verifyFirebase,
  verifyAdmin,
  toggleBan
);

router.patch(
  "/:id/verify",
  verifyFirebase,
  verifyAdmin,
  verifyDriver
);

router.patch(
  "/:id/wallet",
  verifyFirebase,
  verifyAdmin,
  updateWallet
);

router.patch(
  "/:id/reset-password",
  verifyFirebase,
  verifyAdmin,
  resetPassword
);

router.post(
  "/wallet/initiate-transfer",
  verifyFirebase,
  verifyAdmin,
  initiateTransferToUser
);

router.post(
  "/wallet/confirm-transfer",
  verifyFirebase,
  verifyAdmin,
  confirmTransferToUser
);

router.patch(
  "/drivers/:id/joker-window",
  verifyFirebase,
  verifyAdmin,
  updateJokerWindow
);

export default router;
