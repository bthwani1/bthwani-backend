// src/routes/deliveryMarketplaceV1/deliveryProductRoutes.ts

import express from "express";
import * as controller from "../../controllers/delivery_marketplace_v1/DeliveryProductController";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import DeliveryProduct from "../../models/delivery_marketplace_v1/DeliveryProduct";

const router = express.Router();

router.post("/", verifyFirebase, verifyAdmin, controller.create);

router.get("/", controller.getAll);

router.get("/:id", controller.getById);

router.put("/:id", verifyFirebase, verifyAdmin, controller.update);
router.delete("/:id", verifyFirebase, verifyAdmin, controller.remove);

router.get("/daily-offers", async (req, res) => {
  try {
    const offers = await DeliveryProduct.find({ isDailyOffer: true }).limit(10);
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب العروض اليومية" });
  }
});

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

/**
 * @swagger
 * /api/v1/delivery/products/search:
 *   get:
 *     summary: بحث في المنتجات مع فلترة متقدمة
 *     description: يعيد قائمة المنتجات مع دعم البحث النصي والفلترة حسب الفئة والسعر والمتجر والتوفر مع ترتيب متعدد
 *     tags: [Delivery, Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: نص البحث في اسم المنتج أو الوصف أو العلامات
 *         example: ماء طبيعي
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: فلترة حسب فئة المنتج
 *         example: 60f1b2b3c4d5e6f7g8h9i0j1
 *       - in: query
 *         name: subCategory
 *         schema:
 *           type: string
 *         description: فلترة حسب الفئة الداخلية
 *         example: 60f1b2b3c4d5e6f7g8h9i0j2
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: فلترة حسب المتجر
 *         example: 60f1b2b3c4d5e6f7g8h9i0j3
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: الحد الأدنى للسعر
 *         example: 5.0
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: الحد الأقصى للسعر
 *         example: 50.0
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: فلترة حسب التوفر
 *         example: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: رقم الصفحة
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: عدد العناصر في الصفحة (افتراضي 20، أقصى 50)
 *         example: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, priceAsc, priceDesc, rating, new]
 *         description: ترتيب النتائج
 *         example: relevance
 *     responses:
 *       200:
 *         description: نتائج البحث في المنتجات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 60f1b2b3c4d5e6f7g8h9i0j1
 *                       name:
 *                         type: string
 *                         example: ماء طبيعي 500مل
 *                       price:
 *                         type: number
 *                         example: 2.5
 *                       isAvailable:
 *                         type: boolean
 *                         example: true
 *                       storeInfo:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                 hasMore:
 *                   type: boolean
 *                   description: هل توجد صفحات إضافية
 *                   example: true
 *                 total:
 *                   type: integer
 *                   description: إجمالي عدد النتائج
 *                   example: 45
 *                 page:
 *                   type: integer
 *                   description: رقم الصفحة الحالية
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   description: عدد العناصر في الصفحة
 *                   example: 20
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/search", controller.searchProducts);

export default router;
