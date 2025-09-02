// src/routes/deliveryMarketplaceV1/deliveryOfferRoutes.ts

import express from "express";
import * as controller from "../../controllers/delivry_Marketplace_V1/DeliveryOfferController";
import { verifyAdmin } from "../../middleware/verifyAdmin";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: DeliveryOffers
 *     description: إدارة العروض في سوق التوصيل V1
 */

/**
 * @swagger
 * /delivery/offers:
 *   post:
 *     summary: إنشاء عرض جديد
 *     description: يتيح للأدمن المصادق عليه إضافة عرض جديد في سوق التوصيل V1.
 *     tags: [DeliveryOffers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات العرض الجديد (الاسم، الوصف، السعر، تاريخ الانتهاء، إلخ).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "خصم 20% على التوصيل"
 *                 description: عنوان العرض
 *               description:
 *                 type: string
 *                 example: "عرض خاص على جميع طلبات التوصيل حتى نهاية الشهر."
 *                 description: وصف العرض
 *               discountPercentage:
 *                 type: number
 *                 example: 20
 *                 description: نسبة الخصم المقدمة في العرض
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-07-31T23:59:59Z"
 *                 description: تاريخ انتهاء صلاحية العرض
 *             required:
 *               - title
 *               - discountPercentage
 *               - validUntil
 *     responses:
 *       201:
 *         description: تم إنشاء العرض بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryOffer'
 *       400:
 *         description: البيانات المقدمة غير صالحة أو ناقصة.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       500:
 *         description: خطأ في الخادم أثناء إنشاء العرض.
 */
router.post("/", verifyAdmin, controller.create);

/**
 * @swagger
 * /delivery/offers:
 *   get:
 *     summary: جلب جميع العروض
 *     description: يعرض قائمة بجميع العروض المتاحة في سوق التوصيل V1.
 *     tags: [DeliveryOffers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب قائمة العروض بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryOffer'
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       500:
 *         description: خطأ في الخادم أثناء جلب العروض.
 */
router.get("/", controller.getAll);

/**
 * @swagger
 * /delivery/offers/{id}:
 *   get:
 *     summary: جلب عرض معين بواسطة المعرف
 *     description: يعرض تفاصيل عرض محدد في سوق التوصيل V1 بواسطة معرّفه.
 *     tags: [DeliveryOffers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف العرض المطلوب جلبه
 *     responses:
 *       200:
 *         description: تم جلب تفاصيل العرض بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryOffer'
 *       400:
 *         description: معرّف غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       404:
 *         description: لم يتم العثور على العرض المطلوب.
 *       500:
 *         description: خطأ في الخادم أثناء جلب العرض.
 */
router.get("/:id", verifyAdmin, controller.getById);

/**
 * @swagger
 * /delivery/offers/{id}:
 *   put:
 *     summary: تعديل عرض معين بواسطة المعرف
 *     description: يتيح للأدمن المصادق عليه تعديل بيانات عرض موجود في سوق التوصيل V1 بواسطة معرّفه.
 *     tags: [DeliveryOffers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف العرض المراد تعديله
 *     requestBody:
 *       description: الحقول المراد تعديلها في العرض (مثل العنوان، الوصف، نسبة الخصم، إلخ).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "خصم 25% على التوصيل"
 *                 description: العنوان المحدث للعرض
 *               description:
 *                 type: string
 *                 example: "تم تحديث نسبة الخصم إلى 25% اعتبارًا من اليوم."
 *                 description: الوصف المحدث للعرض
 *               discountPercentage:
 *                 type: number
 *                 example: 25
 *                 description: نسبة الخصم المحدثة في العرض
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-08-15T23:59:59Z"
 *                 description: تاريخ انتهاء صلاحية العرض المحدث
 *             required:
 *               - title
 *               - discountPercentage
 *               - validUntil
 *     responses:
 *       200:
 *         description: تم تعديل العرض بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryOffer'
 *       400:
 *         description: البيانات المقدمة غير صالحة أو ناقصة.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       404:
 *         description: لم يتم العثور على العرض المطلوب.
 *       500:
 *         description: خطأ في الخادم أثناء تعديل العرض.
 */
router.put("/:id", verifyAdmin, controller.update);

/**
 * @swagger
 * /delivery/offers/{id}:
 *   delete:
 *     summary: حذف عرض معين بواسطة المعرف
 *     description: يتيح للأدمن المصادق عليه حذف عرض من سوق التوصيل V1 بواسطة معرّفه.
 *     tags: [DeliveryOffers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف العرض المراد حذفه
 *     responses:
 *       200:
 *         description: تم حذف العرض بنجاح.
 *       400:
 *         description: معرّف غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       404:
 *         description: لم يتم العثور على العرض المطلوب.
 *       500:
 *         description: خطأ في الخادم أثناء حذف العرض.
 */
router.delete("/:id", verifyAdmin, controller.remove);

export default router;
