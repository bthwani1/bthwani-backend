// src/routes/userAvatarRoutes.ts

import express from "express";
import { verifyFirebase } from "../middleware/verifyFirebase";
import { uploadAvatar } from "../controllers/user/userAvatarController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: UserAvatar
 *     description: إدارة صور المستخدمين
 */

/**
 * @swagger
 * /users/avatar:
 *   patch:
 *     summary: تحديث صورة الملف الشخصي للمستخدم
 *     description: يتيح للمستخدم المصادَق عليه (Firebase) رفع صورة جديدة لملفه الشخصي.
 *     tags: [UserAvatar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: يجب إرسال ملف الصورة باستخدام صيغة FormData تحت الحقل "avatar"
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: ملف الصورة (JPEG, PNG, إلخ)
 *             required:
 *               - avatar
 *     responses:
 *       200:
 *         description: تم تحديث الصورة بنجاح، ويُعاد عنوان URL للصورة الجديدة.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatarUrl:
 *                   type: string
 *                   example: "https://cdn.example.com/avatars/64a0f2c7ae3c8b39f9d4d3e1.png"
 *       400:
 *         description: لم يتم تضمين ملف أو نوع الملف غير مدعوم.
 *       401:
 *         description: المستخدم غير مصادَق عليه أو توكين غير صالح.
 *       500:
 *         description: خطأ في الخادم أثناء معالجة الصورة.
 */
router.patch("/avatar", verifyFirebase, uploadAvatar);

export default router;
