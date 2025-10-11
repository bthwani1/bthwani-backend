// src/routes/deliveryMarketplaceV1/deliveryOrderRoutes.ts

import express, { Request, Response } from "express";
import * as controller from "../../controllers/delivery_marketplace_v1/DeliveryOrderController";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import Order from "../../models/delivery_marketplace_v1/Order";
import { authVendor } from "../../middleware/authVendor";
import {
  driverDeliver,
  driverPickUp,
} from "../../controllers/delivery_marketplace_v1/orderDriver";
import { getDeliveryFee } from "../../controllers/delivery_marketplace_v1/DeliveryCartController";
import { rateOrder } from "../../controllers/delivery_marketplace_v1/orderRating";
import Vendor from "../../models/vendor_app/Vendor";
import MerchantProduct from "../../models/mckathi/MerchantProduct";
import DeliveryProduct from "../../models/delivery_marketplace_v1/DeliveryProduct";
import { createErrandOrder } from "../../controllers/delivery_marketplace_v1/AkhdimniController";

const router = express.Router();

router.post("/", verifyFirebase, controller.createOrder);
router.post("/errand", verifyFirebase, createErrandOrder);

router.delete("/orders/:id", verifyFirebase, controller.cancelOrder);
router.put("/:id/vendor-accept", authVendor, controller.vendorAcceptOrder);
router.put("/:id/vendor-cancel", authVendor, controller.vendorCancelOrder);
router.post("/:id/rate", verifyFirebase, rateOrder);
router.get("/export/orders/excel", controller.exportOrdersToExcel);
router.get("/me", verifyFirebase, controller.getUserOrders);

router.patch("/:id/driver-pickup", driverPickUp);
router.patch(
  "/:id/admin-status",
  verifyFirebase,
  verifyAdmin,
  controller.adminChangeStatus
);
router.patch("/:id/driver-deliver", driverDeliver);
router.get(
  "/vendor/orders",
  authVendor,

  async (req: Request, res: Response) => {
    try {
      // 1. جلب التاجر الحالي من خلال التوكن
      const vendor = await Vendor.findById(req.user!.vendorId).lean();
      if (!vendor) {
        res.status(404).json({ message: "التاجر غير موجود" });
        return;
      }

      // 2. جلب معرف المتجر الخاص بالتاجر
      const storeId = vendor.store;
      if (!storeId) {
        res.status(404).json({ message: "لا يوجد متجر مرتبط بهذا التاجر" });
        return;
      }

      // 3. جلب جميع الطلبات التي تحتوي على subOrder خاص بمتجر هذا التاجر
      const orders = await Order.find({
        "subOrders.store": storeId,
      })
        .populate("subOrders.store", "name logo address")
        .lean();
      const allMerchantProductIds = [];
      const allDeliveryProductIds = [];

      for (const order of orders) {
        for (const sub of order.subOrders) {
          for (const item of sub.items) {
            if (item.productType === "merchantProduct")
              allMerchantProductIds.push(item.product);
            if (item.productType === "deliveryProduct")
              allDeliveryProductIds.push(item.product);
          }
        }
      }
      const merchantProducts = await MerchantProduct.find({
        _id: { $in: allMerchantProductIds },
      })
        .select("price customImage product") // أضف product
        .populate({ path: "product", select: "name" }) // جلب الاسم من ProductCatalog
        .lean();
      const deliveryProducts = await DeliveryProduct.find({
        _id: { $in: allDeliveryProductIds },
      })
        .select("name price image")
        .lean();

      // عمل index للنتائج:
      const merchantProductMap = Object.fromEntries(
        merchantProducts.map((p) => [
          p._id.toString(),
          {
            ...p,
            name:
              typeof p.product === "object" && p.product && "name" in p.product
                ? p.product.name
                : undefined,
          },
        ])
      );
      const deliveryProductMap = Object.fromEntries(
        deliveryProducts.map((p) => [p._id.toString(), p])
      );
      for (const order of orders) {
        for (const sub of order.subOrders) {
          for (const item of sub.items) {
            if (item.productType === "merchantProduct") {
              (item as any).details =
                merchantProductMap[item.product.toString()] || null;
            }
            if (item.productType === "deliveryProduct") {
              (item as any).details =
                deliveryProductMap[item.product.toString()] || null;
            }
          }
        }
      }

      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "خطأ بالخادم" });
    }
  }
);

router.get("/fee", verifyFirebase, getDeliveryFee); // ← أضف verifyFirebase هنا

router.get("/user/:userId", controller.getUserOrders);
router.post("/:id/repeat", controller.repeatOrder);

router.get("/:id", controller.getOrderById);

/**
 * @swagger
 * /api/v1/delivery/order:
 *   get:
 *     summary: جلب قائمة الطلبات مع فلترة شاملة وتصفح
 *     description: يعيد قائمة جميع الطلبات مع دعم البحث والفلترة المتقدمة والتصفح
 *     tags: [Delivery, Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: نص البحث في تفاصيل الطلب
 *         example: ""
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
 *         name: sort
 *         schema:
 *           type: string
 *         description: ترتيب البيانات (مثال: createdAt:desc)
 *         example: createdAt:desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_confirmation, under_review, preparing, assigned, out_for_delivery, delivered, returned, awaiting_procurement, procured, procurement_failed, cancelled]
 *         description: فلترة حسب حالة الطلب
 *         example: delivered
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: فلترة حسب المدينة
 *         example: الرياض
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: فلترة حسب المتجر
 *         example: 60f1b2b3c4d5e6f7g8h9i0j1
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *         description: فلترة حسب السائق
 *         example: 60f1b2b3c4d5e6f7g8h9i0j2
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [cash, card, wallet, cod, mixed]
 *         description: فلترة حسب طريقة الدفع
 *         example: cash
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ البداية للفلترة
 *         example: 2024-01-01
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ النهاية للفلترة
 *         example: 2024-01-31
 *     responses:
 *       200:
 *         description: قائمة الطلبات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60f1b2b3c4d5e6f7g8h9i0j1
 *                           user:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: 60f1b2b3c4d5e6f7g8h9i0j2
 *                               fullName:
 *                                 type: string
 *                                 example: محمد أحمد
 *                               phone:
 *                                 type: string
 *                                 example: "+966501234567"
 *                           driver:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: 60f1b2b3c4d5e6f7g8h9i0j3
 *                               fullName:
 *                                 type: string
 *                                 example: أحمد محمد
 *                               phone:
 *                                 type: string
 *                                 example: "+966501234568"
 *                           status:
 *                             type: string
 *                             enum: [pending_confirmation, under_review, preparing, assigned, out_for_delivery, delivered, returned, awaiting_procurement, procured, procurement_failed, cancelled]
 *                             example: delivered
 *                           totalAmount:
 *                             type: number
 *                             example: 125.50
 *                           paymentMethod:
 *                             type: string
 *                             enum: [cash, card, wallet, cod, mixed]
 *                             example: cash
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-01-15T10:30:00.000Z
 *                           address:
 *                             type: object
 *                             properties:
 *                               city:
 *                                 type: string
 *                                 example: الرياض
 *                               street:
 *                                 type: string
 *                                 example: شارع الملك فهد
 *       401:
 *         $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", verifyFirebase, verifyAdmin, controller.getAllOrders);

// تعيين/تغيير سائق (طلب كامل)
router.patch(
  "/:id/assign-driver",
  verifyFirebase,
  verifyAdmin,
  controller.assignDriver
);

// تعيين/تغيير سائق (SubOrder)
router.patch(
  "/:orderId/sub-orders/:subId/assign-driver",
  verifyFirebase,
  verifyAdmin,
  controller.assignDriverToSubOrder
);

// تغيير حالة SubOrder
router.patch(
  "/:orderId/sub-orders/:subId/status",
  verifyFirebase,
  verifyAdmin,
  controller.updateSubOrderStatus
);

// POD للطلب الكامل
router.patch("/:id/pod", verifyFirebase, verifyAdmin, controller.setOrderPOD);

// POD للـ SubOrder
router.patch(
  "/:orderId/sub-orders/:subId/pod",
  verifyFirebase,
  verifyAdmin,
  controller.setSubOrderPOD
);

// ملاحظات
router.post("/:id/notes", verifyFirebase, verifyAdmin, controller.addOrderNote);
router.get("/:id/notes", verifyFirebase, verifyAdmin, controller.getOrderNotes);

router.put("/:id/status", verifyFirebase, controller.updateOrderStatus);

export default router;
