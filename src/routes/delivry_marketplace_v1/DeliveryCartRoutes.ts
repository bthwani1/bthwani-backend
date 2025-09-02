// src/routes/deliveryCart.routes.ts

import express from "express";
import * as controller from "../../controllers/delivry_Marketplace_V1/DeliveryCartController";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { optionalAuth } from "../../middleware/optionalAuth";

const router = express.Router();

// السماح بالوصول الاختياري للمستخدم المسجّل أو الضيف
router.use(optionalAuth);

/**
 * @swagger
 * tags:
 *   - name: DeliveryCart
 *     description: إدارة سلة التسوق في سوق التوصيل V1
 */

/**
 * @swagger
 * /delivery/cart/user/{userId}:
 *   get:
 *     summary: جلب سلة المستخدم بواسطة معرّف المستخدم
 *     description: يعرض محتويات سلة التسوق المرتبطة بمستخدم محدد. إذا كان المستخدم غير مسجّل دخول، يمكن جلب سلة ضيف بناءً على معرف الجلسة.
 *     tags: [DeliveryCart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف المستخدم المرتبط بسلة التسوق
 *     responses:
 *       200:
 *         description: تم جلب محتويات سلة المستخدم بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: معرّف المستخدم غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: لم يتم العثور على سلة التسوق للمستخدم المحدد.
 *       500:
 *         description: خطأ في الخادم أثناء جلب سلة المستخدم.
 */
router.get("/user/:userId", controller.getCart);

/**
 * @swagger
 * /delivery/cart/{cartId}:
 *   get:
 *     summary: جلب سلة بواسطة معرّف السلة
 *     description: يعرض محتويات سلة التسوق بناءً على معرّف السلة المحدد.
 *     tags: [DeliveryCart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف سلة التسوق المراد جلبها
 *     responses:
 *       200:
 *         description: تم جلب محتويات سلة التسوق بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: معرّف السلة غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: لم يتم العثور على سلة التسوق المحددة.
 *       500:
 *         description: خطأ في الخادم أثناء جلب السلة.
 */
router.get("/:cartId", controller.getCart);

/**
 * @swagger
 * /delivery/cart/add:
 *   post:
 *     summary: إضافة أو تحديث عنصر في السلة
 *     description: يضيف منتجًا جديدًا إلى سلة التسوق أو يحدث الكمية إذا كان المنتج موجودًا مسبقًا. يدعم المستخدم الضيف أو المسجل.
 *     tags: [DeliveryCart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات المنتج المراد إضافته أو تحديثه (معرّف المنتج، الكمية، إلخ).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItemInput'
 *     responses:
 *       200:
 *         description: تم إضافة/تحديث العنصر في السلة بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: البيانات المقدمة غير صالحة (مثلاً: معرف المنتج مفقود أو الكمية غير صالحة).
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       500:
 *         description: خطأ في الخادم أثناء معالجة إضافة/تحديث العنصر.
 */
router.post("/add", controller.addOrUpdateCart);

/**
 * @swagger
 * /delivery/cart/user/{userId}:
 *   delete:
 *     summary: تفريغ سلة المستخدم بواسطة معرّف المستخدم
 *     description: يزيل جميع العناصر من سلة التسوق لمستخدم محدد.
 *     tags: [DeliveryCart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف المستخدم المرتبط بالسلة المراد تفريغها
 *     responses:
 *       200:
 *         description: تم تفريغ سلة المستخدم بنجاح.
 *       400:
 *         description: معرّف المستخدم غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: لم يتم العثور على سلة المستخدم المحددة.
 *       500:
 *         description: خطأ في الخادم أثناء تفريغ السلة.
 */
router.delete("/user/:userId", controller.clearCart);

/**
 * @swagger
 * /delivery/cart/{cartId}:
 *   delete:
 *     summary: تفريغ السلة بواسطة معرّف السلة
 *     description: يزيل جميع العناصر من سلة التسوق المحددة بواسطة معرّف السلة.
 *     tags: [DeliveryCart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف سلة التسوق المراد تفريغها
 *     responses:
 *       200:
 *         description: تم تفريغ السلة بنجاح.
 *       400:
 *         description: معرّف السلة غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: لم يتم العثور على السلة المحددة.
 *       500:
 *         description: خطأ في الخادم أثناء تفريغ السلة.
 */
router.delete("/:cartId", controller.clearCart);

/**
 * @swagger
 * /delivery/cart/{cartId}/items/{productId}:
 *   delete:
 *     summary: إزالة عنصر من السلة بواسطة معرّف السلة ومعرّف المنتج
 *     description: يتيح للمستخدم حذف عنصر محدد من سلة التسوق.
 *     tags: [DeliveryCart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف سلة التسوق التي سيتم حذف العنصر منها
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف المنتج المراد إزالته من السلة
 *     responses:
 *       200:
 *         description: تم إزالة العنصر من السلة بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: معرّفات السلة أو المنتج غير صالحة.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: لم يتم العثور على السلة أو العنصر المطلوب.
 *       500:
 *         description: خطأ في الخادم أثناء إزالة العنصر.
 */
router.delete("/:cartId/items/:productId", controller.removeItem);

/**
 * @swagger
 * /delivery/cart/user/{userId}/items/{productId}:
 *   delete:
 *     summary: إزالة عنصر من سلة المستخدم بواسطة معرّف المستخدم ومعرّف المنتج
 *     description: يتيح للمستخدم حذف عنصر محدد من سلة التسوق المرتبطة بحسابه.
 *     tags: [DeliveryCart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف المستخدم الذي تابعة له السلة
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف المنتج المراد إزالته من سلة المستخدم
 *     responses:
 *       200:
 *         description: تم إزالة العنصر من سلة المستخدم بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: معرّف المستخدم أو المنتج غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: لم يتم العثور على سلة المستخدم أو العنصر المطلوب.
 *       500:
 *         description: خطأ في الخادم أثناء إزالة العنصر.
 */
router.delete("/user/:userId/items/:productId", controller.removeItem);

router.put(
  "/items/:productId",
  verifyFirebase,
  controller.updateCartItemQuantity
);

router.get("/fee", controller.getDeliveryFee);

/**
 * @swagger
 * /delivery/cart:
 *   get:
 *     summary: جلب جميع السلات
 *     description: يعرض قائمة بجميع سلات التسوق في النظام (للأدمن أو لغرض الإحصاءات).
 *     tags: [DeliveryCart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب قائمة السلات بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cart'
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات غير كافية لعرض جميع السلات.
 *       500:
 *         description: خطأ في الخادم أثناء جلب السلات.
 */
router.get("/", controller.getAllCarts);

/**
 * @swagger
 * /delivery/cart/abandoned:
 *   get:
 *     summary: جلب السلات المهجورة
 *     description: يعرض قائمة بجميع سلات التسوق التي لم يكمل المستخدم عملية الشراء فيها (مهجورة).
 *     tags: [DeliveryCart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب قائمة السلات المهجورة بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cart'
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات غير كافية لعرض السلات المهجورة.
 *       500:
 *         description: خطأ في الخادم أثناء جلب السلات المهجورة.
 */
router.get("/abandoned", controller.getAbandonedCarts);

/**
 * @swagger
 * /delivery/cart/merge:
 *   post:
 *     summary: دمج سلتين معًا
 *     description: يتيح للمستخدم المصادق عليه (Firebase) دمج سلة ضيف مع سلة حسابه المسجل. يُستخدَم عند تسجيل الدخول لحفظ العناصر.
 *     tags: [DeliveryCart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات الدمج (معرّف سلة الضيف ومعرّف المستخدم أو سلة المستخدم).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestCartId:
 *                 type: string
 *                 example: "guestCart123"
 *                 description: معرّف سلة التسوق الخاصة بالضيف
 *               userId:
 *                 type: string
 *                 example: "user456"
 *                 description: معرّف المستخدم المسجل الذي سيتم دمج السلتين معه
 *             required:
 *               - guestCartId
 *               - userId
 *     responses:
 *       200:
 *         description: تم دمج السلات بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: البيانات المقدمة غير صالحة أو السلة غير موجودة.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       500:
 *         description: خطأ في الخادم أثناء دمج السلات.
 */
router.post("/merge", verifyFirebase, controller.mergeCart);

export default router;
