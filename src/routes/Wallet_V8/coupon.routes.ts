// src/routes/couponRoutes.ts

import express from "express";
import {
  createCoupon,
  validateCoupon,
  markCouponAsUsed,
  redeemPoints,
} from "../../controllers/Wallet_V8/coupon.controller";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { Coupon } from "../../models/Wallet_V8/coupon.model";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Wallet
 *     description: إدارة القسائم (Coupons) والمحفظة
 */

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: إنشاء قسائم جديدة
 *     description: يتيح للمسؤول إنشاء مجموعة من القسائم لاستخدامها لاحقًا من قبل المستخدمين.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: تفاصيل القسائم التي سيتم إنشاؤها
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCouponInput'
 *     responses:
 *       201:
 *         description: تم إنشاء القسائم بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: بيانات غير صالحة لإنشاء القسائم.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو منتهي الصلاحية.
 *       403:
 *         description: يتطلب صلاحيات المسؤول (Admin).
 */
router.post("/coupons", verifyAdmin, createCoupon);

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     summary: التحقق من صحة القسيمة
 *     description: يسمح للمستخدم بالتحقق مما إذا كانت القسيمة صالحة للاستخدام.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات القسيمة للتحقق منها
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateCouponInput'
 *     responses:
 *       200:
 *         description: نتيجة التحقق من القسيمة (صالحة أم لا).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValid:
 *                   type: boolean
 *                   example: true
 *                 discountAmount:
 *                   type: number
 *                   example: 10.0
 *       400:
 *         description: بيانات تحقق القسيمة غير صحيحة أو منتهية الصلاحية.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو منتهي الصلاحية.
 */
router.post("/coupons/validate", verifyFirebase, validateCoupon);

/**
 * @swagger
 * /coupons/use:
 *   post:
 *     summary: تفعيل استخدام القسيمة
 *     description: يسمح للمستخدم المعتمد (Firebase) باستخدام قسيمته وتخفيض المبلغ أو النقاط.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات القسيمة للاستخدام
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UseCouponInput'
 *     responses:
 *       200:
 *         description: تم استخدام القسيمة بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: لا يمكن استخدام القسيمة (ربما منتهية الصلاحية أو مستخدمة بالكامل).
 *       401:
 *         description: لم يتم تقديم توكين صالح أو منتهي الصلاحية.
 *       404:
 *         description: لم يتم العثور على القسيمة.
 */
router.post("/coupons/use", verifyFirebase, markCouponAsUsed);

/**
 * @swagger
 * /coupons/user:
 *   get:
 *     summary: جلب القسائم المتاحة أو المخصصة للمستخدم الحالي
 *     description: يعرض جميع القسائم الصالحة التي يمكن للمستخدم استخدامها (المخصصة له أو العامة وغير منتهية الصلاحية).
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة القسائم المتوفرة للمستخدم.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: لم يتم تقديم توكين صالح أو منتهي الصلاحية.
 */
router.get("/coupons/user", verifyFirebase, async (req, res) => {
  const userId = req.user!.id;
  const coupons = await Coupon.find({
    $and: [
      { expiryDate: { $gte: new Date() } },
      { $or: [{ assignedTo: userId }, { assignedTo: null }] },
      { $expr: { $lt: ["$usedCount", { $ifNull: ["$usageLimit", 1] }] } }, // 👈 بدل usedCount: {$lt: "$usageLimit"}
    ],
  });
  res.json(coupons);
});

/**
 * @swagger
 * /coupons/redeem:
 *   post:
 *     summary: استبدال النقاط بقسائم
 *     description: يتيح للمستخدم المصادق عليه استبدال نقاطه بقسيمة جديدة.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات الاستبدال (كم عدد النقاط المراد استبدالها وقيمة القسيمة المطلوبة)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RedeemPointsInput'
 *     responses:
 *       200:
 *         description: تم استبدال النقاط بقسيمة بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: لا توجد نقاط كافية للاستبدال أو البيانات غير صحيحة.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو منتهي الصلاحية.
 *       404:
 *         description: المستخدم أو الحساب غير موجود.
 */
router.post("/coupons/redeem", verifyFirebase, redeemPoints);

export default router;
