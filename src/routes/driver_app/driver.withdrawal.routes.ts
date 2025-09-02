// src/routes/driver/withdrawalRoutes.ts

import express from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  requestWithdrawal,
  getMyWithdrawals,
} from "../../controllers/driver_app/driver.withdrawal.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: DriverApp
 *     description: واجهة تطبيق السائق لإدارة السحب من المحفظة
 */

/**
 * @swagger
 * /driver/withdrawals:
 *   post:
 *     summary: تقديم طلب سحب
 *     description: يتيح للسائق المصادق عليه (Firebase) إنشاء طلب سحب مبلغ من رصيده في المحفظة.
 *     tags: [DriverApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات طلب السحب (المبلغ المراد سحبه ورقم الحساب أو تفاصيل الدفع إن وجدت).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100.0
 *                 description: المبلغ المراد سحبه من المحفظة
 *               bankAccount:
 *                 type: string
 *                 example: "SA1234567890123456789012"
 *                 description: رقم الحساب البنكي أو تفاصيل السحب (إن وُجد)
 *             required:
 *               - amount
 *     responses:
 *       201:
 *         description: تم إنشاء طلب السحب بنجاح، في انتظار الموافقة.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 withdrawalId:
 *                   type: string
 *                   example: "wd123"
 *                   description: معرّف طلب السحب الذي تم إنشاؤه
 *                 amount:
 *                   type: number
 *                   example: 100.0
 *                   description: المبلغ المطلوب سحبه
 *                 status:
 *                   type: string
 *                   example: "pending"
 *                   description: حالة طلب السحب (pending، approved، rejected)
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-06-20T12:34:56Z"
 *                   description: تاريخ ووقت إنشاء طلب السحب
 *       400:
 *         description: البيانات المقدمة غير صالحة (مثلاً: المبلغ مفقود أو غير رقمي).
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       500:
 *         description: خطأ في الخادم أثناء معالجة طلب السحب.
 */
router.post("/driver/withdrawals", authenticate, requestWithdrawal);

/**
 * @swagger
 * /driver/withdrawals:
 *   get:
 *     summary: جلب طلبات السحب الخاصة بالسائق
 *     description: يعرض للسائق المصادق عليه (Firebase) قائمة بجميع طلبات السحب التي قام بتقديمها مع حالتها الحالية.
 *     tags: [DriverApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب قائمة طلبات السحب بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   withdrawalId:
 *                     type: string
 *                     example: "wd123"
 *                     description: معرّف طلب السحب
 *                   amount:
 *                     type: number
 *                     example: 100.0
 *                     description: المبلغ المطلوب سحبه
 *                   status:
 *                     type: string
 *                     example: "approved"
 *                     description: حالة طلب السحب (pending، approved، rejected)
 *                   requestedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-06-20T12:34:56Z"
 *                     description: تاريخ ووقت تقديم طلب السحب
 *                   processedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-06-21T09:00:00Z"
 *                     description: تاريخ ووقت معالجة طلب السحب (إن وجد)
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       500:
 *         description: خطأ في الخادم أثناء جلب طلبات السحب.
 */
router.get("/driver/withdrawals", authenticate, getMyWithdrawals);

export default router;
