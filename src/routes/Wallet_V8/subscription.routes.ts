// src/routes/subscriptionRoutes.ts

import express from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import {
  createSubscription,
  getMySubscription,
} from "../../controllers/Wallet_V8/subscription.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Subscription
 *     description: إدارة الاشتراكات للمستخدم
 */

/**
 * @swagger
 * /subscriptions/my:
 *   get:
 *     summary: جلب اشتراكات المستخدم الحالية
 *     description: يعرض الاشتراك الحالي للمستخدم المصادق عليه (Firebase).
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب الاشتراك بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       404:
 *         description: لم يتم العثور على اشتراك لهذا المستخدم.
 */
router.get("/my", verifyFirebase, getMySubscription);

/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: إنشاء اشتراك جديد
 *     description: يتيح للمستخدم المصادق عليه (Firebase) إنشاء اشتراك جديد أو تجديد الاشتراك الحالي.
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات الاشتراك المطلوبة (نوع الاشتراك، مدة الاشتراك، إلخ).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubscriptionInput'
 *     responses:
 *       201:
 *         description: تم إنشاء الاشتراك بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: بيانات اشتراك غير صالحة.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       409:
 *         description: يوجد اشتراك حالي نشط للمستخدم.
 */
router.post("/", verifyFirebase, createSubscription);

export default router;
