// src/routes/admin/withdrawalAdminRoutes.ts

import express from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import {
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from "../../controllers/admin/admin.withdrawal.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: AdminWithdrawals
 *     description: إدارة طلبات السحب من قِبَل الأدمن
 */

/**
 * @swagger
 * /admin/withdrawals:
 *   get:
 *     summary: جلب جميع طلبات السحب
 *     description: يتيح للأدمن أو السوبر أدمن الاطّلاع على كافة طلبات السحب المقدمة من المستخدمين.
 *     tags: [AdminWithdrawals]
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
 *                 $ref: '#/components/schemas/Withdrawal'
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن أو السوبر أدمن فقط يمكنها الوصول.
 *       500:
 *         description: خطأ في الخادم أثناء جلب طلبات السحب.
 */
router.get(
  "/",
  authenticate,
  authorize(["admin", "superadmin"]),
  listWithdrawals
);

/**
 * @swagger
 * /admin/withdrawals/{id}/approve:
 *   patch:
 *     summary: الموافقة على طلب سحب
 *     description: يتيح للأدمن أو السوبر أدمن الموافقة على طلب سحب مالي معين بواسطة معرّفه.
 *     tags: [AdminWithdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف طلب السحب المراد الموافقة عليه
 *     responses:
 *       200:
 *         description: تمت الموافقة على طلب السحب بنجاح، وتم تحديث حالة المعاملة.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Withdrawal'
 *       400:
 *         description: بيانات غير صالحة أو لا يمكن الموافقة على هذا الطلب.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن أو السوبر أدمن فقط يمكنها الوصول.
 *       404:
 *         description: لم يتم العثور على طلب السحب المطلوب.
 *       500:
 *         description: خطأ في الخادم أثناء الموافقة على طلب السحب.
 */
router.patch(
  "/:id/approve",
  authenticate,
  authorize(["admin", "superadmin"]),
  approveWithdrawal
);

/**
 * @swagger
 * /admin/withdrawals/{id}/reject:
 *   patch:
 *     summary: رفض طلب سحب
 *     description: يتيح للأدمن أو السوبر أدمن رفض طلب سحب مالي معين بواسطة معرّفه.
 *     tags: [AdminWithdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف طلب السحب المراد رفضه
 *     requestBody:
 *       description: سبب الرفض أو ملاحظات إضافية من الأدمن
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "رصيد غير كافٍ في الحساب"
 *                 description: سبب الرفض
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: تم رفض طلب السحب بنجاح، وتم تحديث الحالة مع تسجيل السبب.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Withdrawal'
 *       400:
 *         description: بيانات غير صالحة أو لا يمكن رفض هذا الطلب.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن أو السوبر أدمن فقط يمكنها الوصول.
 *       404:
 *         description: لم يتم العثور على طلب السحب المطلوب.
 *       500:
 *         description: خطأ في الخادم أثناء رفض طلب السحب.
 */
router.patch(
  "/:id/reject",
  authenticate,
  authorize(["admin", "superadmin"]),
  rejectWithdrawal
);

export default router;
