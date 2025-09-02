// src/routes/walletRoutes.ts

import express from "express";
import {
  getWallet,
  chargeWalletViaKuraimi,
  verifyCustomer,
  reverseTransaction,
  getWalletAnalytics,
} from "../../controllers/Wallet_V8/wallet.controller";
import {
  getAllWithdrawals,
  processWithdrawal,
  requestWithdrawal,
} from "../../controllers/Wallet_V8/withdrawal.controller";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Wallet
 *     description: إدارة المحفظة والعمليات المالية
 */

/**
 * @swagger
 * /wallet/wallet:
 *   get:
 *     summary: عرض معلومات المحفظة
 *     description: يُرجع بيانات المحفظة الحالية للمستخدم المصادق عليه (رصيد، رصيد مستحق، إلخ).
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب بيانات المحفظة بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wallet'
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: المحفظة غير موجودة للمستخدم.
 */
router.get("/wallet", verifyFirebase, getWallet);

/**
 * @swagger
 * /wallet/wallet/charge/kuraimi:
 *   post:
 *     summary: شحن المحفظة عبر Kuraimi
 *     description: يتيح للمستخدم المصادق عليه شحن محفظته باستخدام خدمة Kuraimi.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: تفاصيل الشحن (المبلغ، بيانات البطاقة أو الحساب، إلخ).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChargeKuraimiInput'
 *     responses:
 *       200:
 *         description: تم شحن المحفظة بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChargeResult'
 *       400:
 *         description: بيانات الشحن غير صالحة أو رصيد غير كافٍ.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       500:
 *         description: خطأ في الخادم أثناء معالجة الشحن.
 */
router.post("/wallet/charge/kuraimi", verifyFirebase, chargeWalletViaKuraimi);

/**
 * @swagger
 * /wallet/wallet/verify-customer:
 *   post:
 *     summary: التحقق من العميل (Verify Customer)
 *     description: يتأكد من هوية العميل قبل إجراء عملية الدفع أو الشحن عبر Kuraimi.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات العميل للتحقق (رقم الجوال أو معرف المستخدم، إلخ).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyCustomerInput'
 *     responses:
 *       200:
 *         description: تم التحقق من العميل بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: بيانات غير صالحة أو العميل غير موجود.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 */
router.post("/wallet/verify-customer", verifyCustomer);

/**
 * @swagger
 * /wallet/wallet/reverse/{refNo}:
 *   post:
 *     summary: عكس المعاملة
 *     description: يعكس معاملة مالية بناءً على رقم المرجع (refNo)، إن احتاج المستخدم إلى استرجاع المبلغ.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: refNo
 *         required: true
 *         schema:
 *           type: string
 *         description: رقم المرجع الخاص بالمعاملة المراد عكسها
 *     responses:
 *       200:
 *         description: تم عكس المعاملة بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReverseTransactionResult'
 *       400:
 *         description: لا يمكن عكس هذه المعاملة أو البيانات غير صحيحة.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: المعاملة غير موجودة.
 *       500:
 *         description: خطأ في الخادم أثناء محاولة العكس.
 */
router.post("/wallet/reverse/:refNo", verifyFirebase, reverseTransaction);

/**
 * @swagger
 * /wallet/wallet/withdraw-request:
 *   post:
 *     summary: طلب سحب رصيد
 *     description: يقدم المستخدم طلبًا لسحب مبلغ مالي من رصيده المحفوظ في المحفظة.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات طلب السحب (المبلغ والحساب المراد السحب إليه).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WithdrawRequestInput'
 *     responses:
 *       200:
 *         description: تم تقديم طلب السحب بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Withdrawal'
 *       400:
 *         description: بيانات السحب غير صالحة أو رصيد غير كافٍ.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: المحفظة أو المستخدم غير موجود.
 *       500:
 *         description: خطأ في الخادم أثناء معالجة طلب السحب.
 */
router.post("/wallet/withdraw-request", verifyFirebase, requestWithdrawal);

/**
 * @swagger
 * /wallet/admin/withdrawals:
 *   get:
 *     summary: جلب كافة طلبات السحب (للإدارة)
 *     description: يتيح للأدمن عرض قائمة بجميع طلبات السحب المقدمة من المستخدمين.
 *     tags: [Wallet]
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
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       500:
 *         description: خطأ في الخادم أثناء جلب الطلبات.
 */
router.get("/admin/withdrawals", verifyFirebase, getAllWithdrawals);

/**
 * @swagger
 * /wallet/admin/withdrawals/{id}/process:
 *   post:
 *     summary: معالجة طلب سحب محدد (للإدارة)
 *     description: يسمح للأدمن بمعالجة طلب سحب بناءً على معرف الطلب.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرِّف طلب السحب المراد معالجته
 *     responses:
 *       200:
 *         description: تم معالجة طلب السحب بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Withdrawal'
 *       400:
 *         description: لا يمكن معالجة هذا الطلب (ربما تمت معالجته مسبقًا).
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       404:
 *         description: طلب السحب غير موجود.
 *       500:
 *         description: خطأ في الخادم أثناء معالجة الطلب.
 */
router.post(
  "/admin/withdrawals/:id/process",
  verifyAdmin,
  processWithdrawal
);

/**
 * @swagger
 * /wallet/wallet/analytics:
 *   get:
 *     summary: جلب تحليلات المحفظة
 *     description: يعرض بيانات إحصائية عن المحفظة مثل إجمالي الشحنات والسحوبات وعدد المعاملات.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب التحليلات بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletAnalytics'
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: لم يتم العثور على بيانات المحفظة للتحليلات.
 *       500:
 *         description: خطأ في الخادم أثناء جلب التحليلات.
 */
router.get("/wallet/analytics", verifyFirebase, getWalletAnalytics);

export default router;
