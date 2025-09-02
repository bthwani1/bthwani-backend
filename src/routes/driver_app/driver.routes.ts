// src/routes/driver/driverAppRoutes.ts

import express from "express";
import {
  loginDriver,
  changePassword,
  updateLocation,
  updateAvailability,
  getMyProfile,
  updateMyProfile,
  addOtherLocation,
  deleteOtherLocation,
  getMyOrders,
  completeOrder,
  addReviewForUser,
} from "../../controllers/driver_app/driver.controller";
import { authenticate } from "../../middleware/auth.middleware";
import {
  getAssignedOrders,
  listMyVacations,
  requestVacation,
} from "../../controllers/driver_app/vacation.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: DriverApp
 *     description: واجهة تطبيق السائق لإدارة تسجيل الدخول والحساب والطلبات
 */

/**
 * @swagger
 * /driver/login:
 *   post:
 *     summary: تسجيل دخول السائق
 *     description: يتيح للسائق إدخال بيانات الاعتماد (البريد أو الجوال وكلمة المرور) للحصول على توكين المصادقة.
 *     tags: [DriverApp]
 *     requestBody:
 *       description: بيانات تسجيل الدخول (البريد أو الجوال وكلمة المرور).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailOrPhone:
 *                 type: string
 *                 example: "driver@example.com"
 *                 description: البريد الإلكتروني أو رقم الجوال الخاص بالسائق
 *               password:
 *                 type: string
 *                 example: "DriverPass123"
 *                 description: كلمة المرور الخاصة بالسائق
 *             required:
 *               - emailOrPhone
 *               - password
 *     responses:
 *       200:
 *         description: تم تسجيل الدخول بنجاح وإرجاع توكين المصادقة.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   description: توكين JWT الخاص بالسائق
 *                 driverId:
 *                   type: string
 *                   example: "driver123"
 *                   description: معرّف السائق
 *       400:
 *         description: بيانات الاعتماد غير صالحة أو ناقصة.
 *       401:
 *         description: فشل المصادقة؛ الإيميل/الجوال أو كلمة المرور خاطئة.
 *       500:
 *         description: خطأ في الخادم أثناء معالجة تسجيل الدخول.
 */
router.post("/login", loginDriver);
router.post("/vacations", authenticate, requestVacation);
router.get("/vacations", authenticate, listMyVacations);
router.get("/orders", authenticate, getAssignedOrders);
/**
 * @swagger
 * /driver/change-password:
 *   patch:
 *     summary: تغيير كلمة مرور السائق
 *     description: يتيح للسائق المصادق عليه تغيير كلمة المرور الخاصة بحسابه.
 *     tags: [DriverApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات تغيير كلمة المرور (كلمة المرور الحالية والجديدة).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "OldPass123"
 *                 description: كلمة المرور الحالية
 *               newPassword:
 *                 type: string
 *                 example: "NewPass456"
 *                 description: كلمة المرور الجديدة
 *             required:
 *               - currentPassword
 *               - newPassword
 *     responses:
 *       200:
 *         description: تم تغيير كلمة المرور بنجاح.
 *       400:
 *         description: البيانات المقدمة غير صالحة أو كلمة المرور الحالية غير صحيحة.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       500:
 *         description: خطأ في الخادم أثناء تغيير كلمة المرور.
 */
router.patch("/change-password",authenticate, changePassword);

/**
 * @swagger
 * /driver/location:
 *   patch:
 *     summary: تحديث موقع السائق الحالي
 *     description: يتيح للسائق المصادق عليه تحديث إحداثيات موقعه الحالي للتتبع.
 *     tags: [DriverApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات الموقع الجديدة (خط العرض وخط الطول).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 24.7136
 *                 description: خط العرض
 *               longitude:
 *                 type: number
 *                 example: 46.6753
 *                 description: خط الطول
 *             required:
 *               - latitude
 *               - longitude
 *     responses:
 *       200:
 *         description: تم تحديث الموقع بنجاح.
 *       400:
 *         description: البيانات المقدمة غير صالحة.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       500:
 *         description: خطأ في الخادم أثناء تحديث الموقع.
 */
router.patch("/location",authenticate, updateLocation);

/**
 * @swagger
 * /driver/availability:
 *   patch:
 *     summary: تحديث توافر السائق
 *     description: يتيح للسائق المصادق عليه تبديل حالته بين متاح أو غير متاح لاستقبال الطلبات.
 *     tags: [DriverApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات التوافر الجديدة (متاح / غير متاح).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *                 description: true إذا كان السائق متاحًا، false إذا كان غير متاح
 *             required:
 *               - isAvailable
 *     responses:
 *       200:
 *         description: تم تحديث حالة التوافر بنجاح.
 *       400:
 *         description: البيانات المقدمة غير صالحة.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       500:
 *         description: خطأ في الخادم أثناء تحديث التوافر.
 */
router.patch("/availability",authenticate, updateAvailability);

/**
 * @swagger
 * /driver/me:
 *   get:
 *     summary: جلب ملفي الشخصي
 *     description: يتيح للسائق المصادق عليه عرض بيانات حسابه الشخصي.
 *     tags: [DriverApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب بيانات الحساب الشخصي بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverProfile'
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       500:
 *         description: خطأ في الخادم أثناء جلب الملف الشخصي.
 */
router.get("/me", authenticate, getMyProfile);

/**
 * @swagger
 * /driver/me:
 *   patch:
 *     summary: تعديل ملفي الشخصي
 *     description: يتيح للسائق المصادق عليه تعديل بيانات الحساب الشخصي مثل الاسم أو معلومات الاتصال.
 *     tags: [DriverApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: الحقول المراد تحديثها في الملف الشخصي (الاسم، البريد، الجوال، إلخ).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "محمد السالم"
 *                 description: الاسم الجديد
 *               phone:
 *                 type: string
 *                 example: "+966501234567"
 *                 description: رقم الجوال الجديد
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newdriver@example.com"
 *                 description: البريد الإلكتروني الجديد
 *             required:
 *               - name
 *     responses:
 *       200:
 *         description: تم تحديث الملف الشخصي بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverProfile'
 *       400:
 *         description: البيانات المقدمة غير صالحة.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       500:
 *         description: خطأ في الخادم أثناء تحديث الملف الشخصي.
 */
router.patch("/me", authenticate, updateMyProfile);

/**
 * @swagger
 * /driver/locations:
 *   post:
 *     summary: إضافة موقع آخر
 *     description: يتيح للسائق المصادق عليه إضافة موقع إضافي (مثلاً: مناطق خدمة متعددة).
 *     tags: [DriverApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات الموقع الإضافي (اسم الموقع، إحداثياته).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 example: "الرياض - العليا"
 *                 description: وصفٌ أو اسم أقرب معلم للموقع
 *               latitude:
 *                 type: number
 *                 example: 24.7136
 *                 description: خط العرض
 *               longitude:
 *                 type: number
 *                 example: 46.6753
 *                 description: خط الطول
 *             required:
 *               - label
 *               - latitude
 *               - longitude
 *     responses:
 *       201:
 *         description: تم إضافة الموقع الإضافي بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverLocation'
 *       400:
 *         description: البيانات المقدمة غير صالحة.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       500:
 *         description: خطأ في الخادم أثناء إضافة الموقع الإضافي.
 */
router.post("/locations", authenticate, addOtherLocation);

/**
 * @swagger
 * /driver/locations/{index}:
 *   delete:
 *     summary: حذف موقع إضافي بحسب الفهرس
 *     description: يتيح للسائق المصادق عليه حذف موقع إضافي تم إضافته مسبقًا بناءً على فهرسه في القائمة.
 *     tags: [DriverApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *           example: 0
 *         description: فهرس الموقع في قائمة المواقع الإضافية
 *     responses:
 *       200:
 *         description: تم حذف الموقع الإضافي بنجاح.
 *       400:
 *         description: فهرس غير صالح.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       404:
 *         description: لم يتم العثور على الموقع في الفهرس المحدد.
 *       500:
 *         description: خطأ في الخادم أثناء حذف الموقع الإضافي.
 */
router.delete("/locations/:index", authenticate, deleteOtherLocation);

/**
 * @swagger
 * /driver/orders:
 *   get:
 *     summary: جلب جميع الطلبات الخاصة بي
 *     description: يعرض للسائق المصادق عليه قائمة بكل الطلبات التي تم تعيينها إليه.
 *     tags: [DriverApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب قائمة الطلبات بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DriverOrder'
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       500:
 *         description: خطأ في الخادم أثناء جلب الطلبات.
 */
router.get("/orders", authenticate, getMyOrders);

/**
 * @swagger
 * /driver/complete/{orderId}:
 *   post:
 *     summary: تأكيد إتمام الطلب
 *     description: يتيح للسائق المصادق عليه تأكيد استكمال توصيل طلب معين بواسطة معرّف الطلب.
 *     tags: [DriverApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرّف الطلب المراد تأكيد إتمامه
 *     responses:
 *       200:
 *         description: تم تأكيد إتمام الطلب بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId:
 *                   type: string
 *                   example: "order123"
 *                 status:
 *                   type: string
 *                   example: "completed"
 *                   description: الحالة الجديدة للطلب
 *       400:
 *         description: معرّف غير صالح أو الطلب غير مخصّص للسائق الحالي.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       404:
 *         description: لم يتم العثور على الطلب المطلوب.
 *       500:
 *         description: خطأ في الخادم أثناء تأكيد إتمام الطلب.
 */
router.post("/complete/:orderId", authenticate, completeOrder);

/**
 * @swagger
 * /driver/review:
 *   post:
 *     summary: إضافة تقييم لمستخدم
 *     description: يتيح للسائق المصادق عليه تقديم تقييم للمستخدم بعد إتمام التوصيل.
 *     tags: [DriverApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: بيانات التقييم (معرّف المستخدم، التقييم، والنص).
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DriverReviewInput'
 *     responses:
 *       201:
 *         description: تم تقديم التقييم بنجاح.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverReview'
 *       400:
 *         description: البيانات المقدمة غير صالحة.
 *       401:
 *         description: لم يتم تقديم توكين صالح أو انتهت صلاحيته.
 *       404:
 *         description: المستخدم أو الطلب غير موجود.
 *       500:
 *         description: خطأ في الخادم أثناء تقديم التقييم.
 */
router.post("/review", authenticate, addReviewForUser);

export default router;
