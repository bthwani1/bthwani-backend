// src/routes/admin/withdrawalAdminRoutes.ts

import express from "express";
import {
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from "../../controllers/admin/admin.withdrawal.controller";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";

const router = express.Router();

/**
 * @swagger
 * /api/v1/admin/withdrawals:
 *   get:
 *     summary: جلب قائمة طلبات السحب مع تصفح
 *     description: يعيد قائمة طلبات السحب مع دعم التصفح والفلترة
 *     tags: [Admin, Wallet, Withdrawals]
 *     parameters:
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
 *         name: sort
 *         schema:
 *           type: string
 *         description: ترتيب البيانات (مثال: createdAt:desc)
 *         example: createdAt:desc
 *     responses:
 *       200:
 *         description: قائمة طلبات السحب بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     withdrawalRequests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60f1b2b3c4d5e6f7g8h9i0j1
 *                           amount:
 *                             type: number
 *                             example: 150.50
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected, paid]
 *                             example: pending
 *                           userId:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: 60f1b2b3c4d5e6f7g8h9i0j2
 *                               fullName:
 *                                 type: string
 *                                 example: أحمد محمد
 *                               phone:
 *                                 type: string
 *                                 example: "+966501234567"
 *                               role:
 *                                 type: string
 *                                 example: driver
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-01-15T10:30:00.000Z
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", verifyFirebase, verifyAdmin, listWithdrawals);
router.patch("/:id/approve", verifyFirebase, verifyAdmin, approveWithdrawal);
router.patch("/:id/reject", verifyFirebase, verifyAdmin, rejectWithdrawal);

export default router;
