// src/routes/deliveryMarketplaceV1/deliveryProductSubCategoryRoutes.ts

import express from "express";
import * as controller from "../../controllers/delivry_Marketplace_V1/DeliveryProductSubCategoryController";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { requireRole } from "../../middleware/auth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: DeliveryProductSubCategories
 *     description: إدارة الفئات الفرعية لمنتجات سوق التوصيل V1
 */

/**
 * @swagger
 * /delivery/product-subcategories:
 *   post:
 *     summary: إنشاء فئة فرعية جديدة
 *     description: يتيح للأدمن المصادق عليه (Firebase + صلاحية Admin) إضافة فئة فرعية جديدة مرتبطة بمنتجات سوق التوصيل V1.
 *     tags: [DeliveryProductSubCategories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات الفئة الفرعية الجديدة (الاسم ومعرّف الفئة الرئيسية).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "بيتزا وحلويات"
 *                 description: اسم الفئة الفرعية
 *               categoryId:
 *                 type: string
 *                 format: mongoId
 *                 example: "60d21b4667d0d8992e610c85"
 *                 description: معرّف الفئة الرئيسية المرتبطة
 *             required:
 *               - name
 *               - categoryId
 *     responses:
 *       201:
 *         description: تم إنشاء الفئة الفرعية بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryProductSubCategory'
 *       400:
 *         description: البيانات المقدمة غير صالحة أو ناقصة.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       500:
 *         description: خطأ في الخادم أثناء إنشاء الفئة الفرعية.
 */
router.post("/", verifyFirebase,  verifyAdmin, controller.create);

/**
 * @swagger
 * /delivery/product-subcategories/store/{storeId}:
 *   get:
 *     summary: جلب الفئات الفرعية الخاصة بمحّل معين
 *     description: يعرض لجميع المستخدمين المصادق عليهم قائمة الفئات الفرعية المرتبطة بمحّل محدد بواسطة معرّف المحل.
 *     tags: [DeliveryProductSubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *         description: معرّف المحل المطلوب جلب الفئات الفرعية الخاصة به
 *     responses:
 *       200:
 *         description: تم جلب قائمة الفئات الفرعية الخاصة بالمحل بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryProductSubCategory'
 *       400:
 *         description: معرّف المحل غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: لم يتم العثور على الفئات الفرعية للمحل المطلوب.
 *       500:
 *         description: خطأ في الخادم أثناء جلب الفئات الفرعية.
 */
router.get("/store/:storeId", controller.getByStore);
/**
 * @swagger
 * /delivery/product-subcategories:
 *   get:
 *     summary: جلب جميع الفئات الفرعية
 *     description: يعرض قائمة بجميع الفئات الفرعية لمنتجات سوق التوصيل V1.
 *     tags: [DeliveryProductSubCategories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب قائمة الفئات الفرعية بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryProductSubCategory'
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       500:
 *         description: خطأ في الخادم أثناء جلب الفئات الفرعية.
 */
router.get("/", controller.getAll);

/**
 * @swagger
 * /delivery/product-subcategories/{id}:
 *   get:
 *     summary: جلب فئة فرعية معينة بواسطة المعرف
 *     description: يعرض تفاصيل فئة فرعية محددة لمنتجات سوق التوصيل V1 بواسطة معرّفها.
 *     tags: [DeliveryProductSubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *         description: معرّف الفئة الفرعية المطلوب جلبها
 *     responses:
 *       200:
 *         description: تم جلب الفئة الفرعية بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryProductSubCategory'
 *       400:
 *         description: معرّف غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       404:
 *         description: لم يتم العثور على الفئة الفرعية المطلوبة.
 *       500:
 *         description: خطأ في الخادم أثناء جلب الفئة الفرعية.
 */
router.get("/:id", controller.getById);

/**
 * @swagger
 * /delivery/product-subcategories/{id}:
 *   put:
 *     summary: تعديل فئة فرعية معينة بواسطة المعرف
 *     description: يتيح للأدمن المصادق عليه (Firebase + صلاحية Admin) تعديل بيانات فئة فرعية موجودة في سوق التوصيل V1 بواسطة معرّفها.
 *     tags: [DeliveryProductSubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *         description: معرّف الفئة الفرعية المراد تعديلها
 *     requestBody:
 *       description: الحقول المراد تحديثها في الفئة الفرعية (مثل الاسم أو معرّف الفئة الرئيسية).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "مشروبات غازية ومحلّيات"
 *                 description: الاسم المحدث للفئة الفرعية
 *               categoryId:
 *                 type: string
 *                 format: mongoId
 *                 example: "60d21b4667d0d8992e610c85"
 *                 description: معرّف الفئة الرئيسية المحدث
 *             required:
 *               - name
 *               - categoryId
 *     responses:
 *       200:
 *         description: تم تعديل الفئة الفرعية بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryProductSubCategory'
 *       400:
 *         description: البيانات المقدمة غير صالحة أو ناقصة.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       404:
 *         description: لم يتم العثور على الفئة الفرعية المطلوبة.
 *       500:
 *         description: خطأ في الخادم أثناء تعديل الفئة الفرعية.
 */
router.put("/:id", verifyFirebase,   verifyAdmin, controller.update);

/**
 * @swagger
 * /delivery/product-subcategories/{id}:
 *   delete:
 *     summary: حذف فئة فرعية معينة بواسطة المعرف
 *     description: يتيح للأدمن المصادق عليه (Firebase + صلاحية Admin) حذف فئة فرعية من سوق التوصيل V1 بواسطة معرّفها.
 *     tags: [DeliveryProductSubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *         description: معرّف الفئة الفرعية المراد حذفها
 *     responses:
 *       200:
 *         description: تم حذف الفئة الفرعية بنجاح.
 *       400:
 *         description: معرّف غير صالح.
 *       401:
 *         description: توكين غير صالح أو مفقود.
 *       403:
 *         description: صلاحيات الأدمن فقط يمكنها الوصول.
 *       404:
 *         description: لم يتم العثور على الفئة الفرعية المطلوبة.
 *       500:
 *         description: خطأ في الخادم أثناء حذف الفئة الفرعية.
 */
router.delete("/:id", verifyFirebase,   verifyAdmin, controller.remove);



export default router;
