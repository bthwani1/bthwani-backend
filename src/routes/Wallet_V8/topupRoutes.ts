// src/routes/topupRoutes.ts

import express from "express";
import { getLogsHandler, topupHandler } from "../../controllers/Wallet_V8/topupController";
import { payBillHandler } from "../../controllers/Wallet_V8/payBillController";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { TopupLog } from "../../models/Wallet_V8/TopupLog";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Wallet
 *     description: إدارة شحن الرصيد والمدفوعات والفواتير
 */

/**
 * @swagger
 * /topup/topup:
 *   post:
 *     summary: شحن الرصيد
 *     description: يتيح للمستخدم المصادق عليه (Firebase) شحن رصيده عبر وسيلة الدفع المتاحة.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: معلومات عملية الشحن (المبلغ وطريقة الدفع، إلخ)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TopupInput'
 *     responses:
 *       201:
 *         description: تم شحن الرصيد بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TopupResult'
 *       400:
 *         description: بيانات شحن غير صالحة.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       500:
 *         description: خطأ في الخادم أثناء معالجة الشحنة.
 */
router.post("/", topupHandler);

/**
 * @swagger
 * /topup/pay-bill:
 *   post:
 *     summary: دفع فاتورة
 *     description: يتيح للمستخدم المصادق عليه (Firebase) دفع فواتيره من رصيده أو عبر وسيلة دفع أخرى.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات الفاتورة التي سيتم دفعها (رقم الفاتورة، المبلغ، إلخ)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayBillInput'
 *     responses:
 *       200:
 *         description: تم دفع الفاتورة بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PayBillResult'
 *       400:
 *         description: بيانات دفع غير صالحة أو رصيد غير كافٍ.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       404:
 *         description: لم يتم العثور على الفاتورة المحددة.
 *       500:
 *         description: خطأ في الخادم أثناء معالجة الدفع.
 */
router.post("/pay-bill", payBillHandler);

/**
 * @swagger
 * /topup/logs:
 *   get:
 *     summary: جلب سجل جميع عمليات الشحن
 *     description: يعرض جميع سجلات الشحن التي تمت في النظام (للإدارة).
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب سجلات الشحن بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TopupLog'
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       403:
 *         description: يتطلب صلاحيات المسؤول (Admin) للوصول.
 *       500:
 *         description: خطأ في الخادم أثناء جلب السجلات.
 */
router.get("/logs", getLogsHandler);

/**
 * @swagger
 * /topup/my-logs:
 *   get:
 *     summary: جلب سجلات شحن المستخدم الحالية
 *     description: يعرض سجلات شحن الرصيد الخاصة بالمستخدم المصادق عليه (Firebase)، مرتبة تنازليًا حسب التاريخ.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب سجلات الشحن الخاصة بالمستخدم بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TopupLog'
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       500:
 *         description: خطأ في الخادم أثناء جلب السجلات.
 */
router.get("/my-logs", verifyFirebase, async (req, res) => {
  try {
    const logs = await TopupLog.find({ userId: (req as any).user.id }).sort({
      createdAt: -1,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "فشل في جلب العمليات" });
  }
});

export default router;
