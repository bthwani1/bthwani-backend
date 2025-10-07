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
