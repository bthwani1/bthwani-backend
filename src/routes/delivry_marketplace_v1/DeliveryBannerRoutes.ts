// src/routes/deliveryMarketplaceV1/deliveryBannerRoutes.ts

import express from "express";
import * as controller from "../../controllers/delivry_Marketplace_V1/DeliveryBannerController";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: DeliveryBanners
 *     description: إدارة شرائح الإعلان في سوق التوصيل V1
 */
router.get("/admin", controller.getAllAdmin);

/**
 * @swagger
 * /delivery/banners:
 *   post:
 *     summary: إنشاء شريحة إعلان جديدة
 *     description: يتيح للأدمن المصادق عليه (Firebase + صلاحية Admin) إنشاء شريحة إعلان جديدة في سوق التوصيل V1.
 *     tags: [DeliveryBanners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات شريحة الإعلان الجديدة (مثلاً: عنوان الشريحة، رابط الصورة، الرابط الهدف).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "عرض خاص اليوم"
 *                 description: عنوان الشريحة
 *               imageUrl:
 *                 type: string
 *                 format: url
 *                 example: "https://example.com/banner1.jpg"
 *                 description: رابط الصورة المُستخدمة في الشريحة
 *               link:
 *                 type: string
 *                 format: url
 *                 example: "https://example.com/promo"
 *                 description: الرابط الذي سينتقل إليه المستخدم عند الضغط على الشريحة
 *             required:
 *               - title
 *               - imageUrl
 *               - link
 *     responses:
 *       201:
 *         description: تم إنشاء شريحة الإعلان بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryBanner'
 *       400:
 *         description: البيانات المقدمة غير صالحة أو ناقصة.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       500:
 *         description: خطأ في الخادم أثناء إنشاء شريحة الإعلان.
 */
router.post("/", verifyFirebase, verifyAdmin, controller.create);

/**
 * @swagger
 * /delivery/banners:
 *   get:
 *     summary: جلب جميع شرائح الإعلان
 *     description: يعرض قائمة بجميع شرائح الإعلان في سوق التوصيل V1.
 *     tags: [DeliveryBanners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب قائمة شرايح الإعلان بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryBanner'
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       500:
 *         description: خطأ في الخادم أثناء جلب شرائح الإعلان.
 */
router.get("/", controller.getAll);

/**
 * @swagger
 * /delivery/banners/{id}:
 *   get:
 *     summary: جلب شريحة إعلان بواسطة المعرف
 *     description: يعرض تفاصيل شريحة إعلان معينة في سوق التوصيل V1 بواسطة معرّفها.
 *     tags: [DeliveryBanners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف شريحة الإعلان المطلوب جلبها
 *     responses:
 *       200:
 *         description: تم جلب شريحة الإعلان بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryBanner'
 *       400:
 *         description: معرّف غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       404:
 *         description: لم يتم العثور على شريحة الإعلان المطلوبة.
 *       500:
 *         description: خطأ في الخادم أثناء جلب الشريحة.
 */
router.get("/:id", verifyFirebase, verifyAdmin, controller.getById);

/**
 * @swagger
 * /delivery/banners/{id}:
 *   put:
 *     summary: تحديث شريحة إعلان بواسطة المعرف
 *     description: يتيح للأدمن المصادق عليه (Firebase + صلاحية Admin) تحديث بيانات شريحة إعلان موجودة في سوق التوصيل V1 بواسطة معرّفها.
 *     tags: [DeliveryBanners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف شريحة الإعلان المراد تحديثها
 *     requestBody:
 *       description: الحقول المراد تعديلها في شريحة الإعلان (مثل العنوان، رابط الصورة، الرابط الهدف).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "عرض محدث"
 *                 description: العنوان المُحدّث للشريحة
 *               imageUrl:
 *                 type: string
 *                 format: url
 *                 example: "https://example.com/banner1-new.jpg"
 *                 description: رابط الصورة الجديد للشريحة
 *               link:
 *                 type: string
 *                 format: url
 *                 example: "https://example.com/new-promo"
 *                 description: الرابط الهدف الجديد للشريحة
 *             required:
 *               - title
 *               - imageUrl
 *               - link
 *     responses:
 *       200:
 *         description: تم تحديث شريحة الإعلان بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryBanner'
 *       400:
 *         description: البيانات المقدمة غير صالحة أو ناقصة.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       404:
 *         description: لم يتم العثور على شريحة الإعلان المطلوبة.
 *       500:
 *         description: خطأ في الخادم أثناء تحديث الشريحة.
 */
router.put("/:id", verifyFirebase, verifyAdmin, controller.update);

/**
 * @swagger
 * /delivery/banners/{id}:
 *   delete:
 *     summary: حذف شريحة إعلان بواسطة المعرف
 *     description: يتيح للأدمن المصادق عليه (Firebase + صلاحية Admin) حذف شريحة إعلان من سوق التوصيل V1 بواسطة معرّفها.
 *     tags: [DeliveryBanners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف شريحة الإعلان المراد حذفها
 *     responses:
 *       200:
 *         description: تم حذف شريحة الإعلان بنجاح.
 *       400:
 *         description: معرّف غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       404:
 *         description: لم يتم العثور على شريحة الإعلان المطلوبة.
 *       500:
 *         description: خطأ في الخادم أثناء حذف الشريحة.
 */
router.delete("/:id", verifyFirebase, verifyAdmin, controller.remove);

export default router;
