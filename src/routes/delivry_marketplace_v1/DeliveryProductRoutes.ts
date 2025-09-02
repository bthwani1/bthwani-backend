// src/routes/deliveryMarketplaceV1/deliveryProductRoutes.ts

import express from "express";
import * as controller from "../../controllers/delivry_Marketplace_V1/DeliveryProductController";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import DeliveryProduct from "../../models/delivry_Marketplace_V1/DeliveryProduct";
import { requireRole } from "../../middleware/auth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: DeliveryProducts
 *     description: إدارة منتجات سوق التوصيل V1
 */

/**
 * @swagger
 * /delivery/products:
 *   post:
 *     summary: إنشاء منتج جديد
 *     description: يتيح للأدمن المصادق عليه (Firebase + صلاحية Admin) إضافة منتج جديد في سوق التوصيل V1.
 *     tags: [DeliveryProducts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات المنتج الجديد (الاسم، الوصف، السعر، الموقع، إلخ).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryProductInput'
 *     responses:
 *       201:
 *         description: تم إنشاء المنتج بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryProduct'
 *       400:
 *         description: البيانات المقدمة غير صالحة أو ناقصة.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       500:
 *         description: خطأ في الخادم أثناء إنشاء المنتج.
 */
router.post(
  "/",
  verifyFirebase,
  verifyAdmin,
  controller.create
);

/**
 * @swagger
 * /delivery/products:
 *   get:
 *     summary: جلب جميع المنتجات
 *     description: يعرض قائمة بجميع المنتجات في سوق التوصيل V1 مع دعم الفلترة والفرز إن وجد.
 *     tags: [DeliveryProducts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: معرّف الفئة لتصفية المنتجات (اختياري)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: صفحة النتائج عند استخدام pagination (اختياري)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: عدد المنتجات في كل صفحة (اختياري)
 *     responses:
 *       200:
 *         description: تم جلب قائمة المنتجات بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryProduct'
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       500:
 *         description: خطأ في الخادم أثناء جلب المنتجات.
 */
router.get("/", controller.getAll);

/**
 * @swagger
 * /delivery/products/{id}:
 *   get:
 *     summary: جلب منتج معين بواسطة المعرّف
 *     description: يعرض تفاصيل منتج محدد في سوق التوصيل V1 بواسطة معرّفه.
 *     tags: [DeliveryProducts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف المنتج المطلوب جلبه
 *     responses:
 *       200:
 *         description: تم جلب تفاصيل المنتج بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryProduct'
 *       400:
 *         description: معرّف غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: لم يتم العثور على المنتج المطلوب.
 *       500:
 *         description: خطأ في الخادم أثناء جلب المنتج.
 */
router.get("/:id", controller.getById);

/**
 * @swagger
 * /delivery/products/{id}:
 *   put:
 *     summary: تحديث منتج معين بواسطة المعرّف
 *     description: يتيح للأدمن المصادق عليه (Firebase + صلاحية Admin) تعديل بيانات منتج موجود في سوق التوصيل V1 بواسطة معرّفه.
 *     tags: [DeliveryProducts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف المنتج المراد تحديثه
 *     requestBody:
 *       description: الحقول المراد تحديثها في المنتج (مثل الاسم، الوصف، السعر، إلخ).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryProductInput'
 *     responses:
 *       200:
 *         description: تم تحديث المنتج بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryProduct'
 *       400:
 *         description: البيانات المقدمة غير صالحة أو ناقصة.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       404:
 *         description: لم يتم العثور على المنتج المطلوب.
 *       500:
 *         description: خطأ في الخادم أثناء تحديث المنتج.
 */
router.put(
  "/:id",
  verifyFirebase,
  verifyAdmin,
  controller.update
);
/**
 * @swagger
 * /delivery/products/{id}:
 *   delete:
 *     summary: حذف منتج معين بواسطة المعرّف
 *     description: يتيح للأدمن المصادق عليه (Firebase + صلاحية Admin) حذف منتج من سوق التوصيل V1 بواسطة معرّفه.
 *     tags: [DeliveryProducts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف المنتج المراد حذفه
 *     responses:
 *       200:
 *         description: تم حذف المنتج بنجاح.
 *       400:
 *         description: معرّف غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       404:
 *         description: لم يتم العثور على المنتج المطلوب.
 *       500:
 *         description: خطأ في الخادم أثناء حذف المنتج.
 */
router.delete("/:id", verifyFirebase, verifyAdmin, controller.remove);

/**
 * @swagger
 * /delivery/products/daily-offers:
 *   get:
 *     summary: جلب المنتجات ذات العروض اليومية
 *     description: يعرض قائمة بحد أقصى 10 منتجات محدَّدة كعروض يومية في سوق التوصيل V1.
 *     tags: [DeliveryProducts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب قائمة المنتجات ذات العروض اليومية بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryProduct'
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       500:
 *         description: خطأ في الخادم أثناء جلب العروض اليومية.
 */
router.get("/daily-offers", async (req, res) => {
  try {
    const offers = await DeliveryProduct.find({ isDailyOffer: true }).limit(10);
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب العروض اليومية" });
  }
});

/**
 * @swagger
 * /delivery/products/nearby/new:
 *   get:
 *     summary: جلب المنتجات الجديدة القريبة
 *     description: يعرض قائمة بحد أقصى 10 من أحدث المنتجات القريبة من الموقع المرسَل عبر معلمات الاستعلام.
 *     tags: [DeliveryProducts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           example: 24.7136
 *         description: خط العرض للموقع الحالي
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           example: 46.6753
 *         description: خط الطول للموقع الحالي
 *     responses:
 *       200:
 *         description: تم جلب قائمة المنتجات الجديدة القريبة بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryProduct'
 *       400:
 *         description: معلمات الموقع مفقودة أو غير صالحة.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       500:
 *         description: خطأ في الخادم أثناء جلب المنتجات الجديدة.
 */
router.get("/nearby/new", async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ message: "إحداثيات الموقع مطلوبة" });
    return;
  }

  const parsedLat = parseFloat(lat as string);
  const parsedLng = parseFloat(lng as string);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    res.status(400).json({ message: "إحداثيات غير صالحة" });
    return;
  }

  try {
    const recentProducts = await DeliveryProduct.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parsedLng, parsedLat],
          },
          $maxDistance: 5000,
        },
      },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(recentProducts);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب المنتجات الجديدة" });
  }
});

export default router;
