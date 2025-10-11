import { Router } from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import * as c from "../../controllers/admin/vendorModeration.controller";
import { verifyAdmin } from "../../middleware/verifyAdmin";

const r = Router();

r.use(verifyFirebase, verifyAdmin);

/**
 * @swagger
 * /api/v1/admin/vendors:
 *   get:
 *     summary: جلب قائمة التجار مع فلترة وتصفح
 *     description: يعيد قائمة التجار مع دعم البحث والتصفح والفلترة
 *     tags: [Admin, Vendors]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: نص البحث في اسم التاجر أو الهاتف أو البريد الإلكتروني
 *         example: محمد
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: رقم الصفحة
 *         example: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: عدد العناصر في الصفحة
 *         example: 20
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: فلترة حسب حالة التاجر (نشط/غير نشط)
 *         example: true
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: فلترة حسب متجر محدد
 *         example: 60f1b2b3c4d5e6f7g8h9i0j1
 *     responses:
 *       200:
 *         description: قائمة التجار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     vendors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60f1b2b3c4d5e6f7g8h9i0j1
 *                           fullName:
 *                             type: string
 *                             example: محمد أحمد
 *                           phone:
 *                             type: string
 *                             example: "+966501234567"
 *                           email:
 *                             type: string
 *                             example: mohamed@example.com
 *                           isActive:
 *                             type: boolean
 *                             example: true
 *                           store:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: 60f1b2b3c4d5e6f7g8h9i0j2
 *                               name:
 *                                 type: string
 *                                 example: مطعم الرياض
 *                               address:
 *                                 type: string
 *                                 example: الرياض، المملكة العربية السعودية
 *                               category:
 *                                 type: string
 *                                 example: food
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
r.get("/", c.list);
r.get("/:id", c.getOne);
r.get("/stores/:storeId/vendors", c.listByStore);

r.post("/:id/activate", c.activate);
r.post("/:id/deactivate", c.deactivate);
r.patch("/:id", c.update);
r.post("/:id/reset-password", c.resetPassword);

r.delete("/:id", c.remove);

export default r;
