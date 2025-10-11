import express from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import * as controller from "../../controllers/delivery_marketplace_v1/DeliveryStoreController";

const router = express.Router();

console.log("[ROUTE] DeliveryStores (IN-USE) from", __filename);

// عامة
router.get("/", controller.getAll);

/**
 * @swagger
 * /api/v1/delivery/stores/search:
 *   get:
 *     summary: بحث في المتاجر مع فلترة وترتيب بالأقرب
 *     description: يعيد قائمة المتاجر مع دعم البحث والفلترة حسب الفئة والموقع الجغرافي مع ترتيب بالأقرب
 *     tags: [Delivery, Stores]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: نص البحث في اسم المتجر أو العنوان
 *         example: مطعم الرياض
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
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: فلترة حسب فئة المتجر
 *         example: 60f1b2b3c4d5e6f7g8h9i0j1
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           format: float
 *         description: خط العرض لترتيب بالأقرب
 *         example: 24.7136
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           format: float
 *         description: خط الطول لترتيب بالأقرب
 *         example: 46.6753
 *     responses:
 *       200:
 *         description: نتائج البحث في المتاجر بنجاح
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
 *                         example: مطعم الرياض الشهير
 *                       logo:
 *                         type: string
 *                         example: https://example.com/logo.jpg
 *                       address:
 *                         type: string
 *                         example: الرياض، شارع الملك فهد
 *                       location:
 *                         type: object
 *                         properties:
 *                           lat:
 *                             type: number
 *                             example: 24.7136
 *                           lng:
 *                             type: number
 *                             example: 46.6753
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       category:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60f1b2b3c4d5e6f7g8h9i0j2
 *                           name:
 *                             type: string
 *                             example: مطاعم
 *                       distance:
 *                         type: number
 *                         description: المسافة بالمتر (عند استخدام lat/lng)
 *                         example: 1250.5
 *                 hasMore:
 *                   type: boolean
 *                   description: هل توجد صفحات إضافية
 *                   example: true
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/search", controller.searchStores);

router.get("/:id", controller.getById);
router.put("/:id",  controller.update);

// أدمن فقط
const adminOnly = [verifyFirebase, verifyAdmin];
router.post("/", ...adminOnly, controller.create);
router.delete("/:id", ...adminOnly, controller.remove);

export default router;
