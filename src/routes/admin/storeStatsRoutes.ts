// src/routes/admin/storeStatsRoutes.ts
import { Router } from "express";
import { Types } from "mongoose";
import Order from "../../models/delivery_marketplace_v1/Order";
import DeliveryProduct from "../../models/delivery_marketplace_v1/DeliveryProduct";

const router = Router();

/**
 * Get store statistics by period
 * GET /:storeId/stats/:period
 * Where period can be: daily, weekly, monthly, all
 * This route is designed to avoid conflicts with other stats routes
 */
router.get("/:storeId/stats/:period", async (req, res) => {
  const { storeId, period } = req.params as {
    storeId: string;
    period: "daily" | "weekly" | "monthly" | "all";
  };

  const now = new Date();
  let start: Date | undefined;

  if (period === "daily") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "weekly") {
    const day = now.getDay(); // 0 = Sunday (عدّل حسب أسبوعك)
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  } else if (period === "monthly") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start = undefined; // all
  }

  const storeObjectId = new Types.ObjectId(storeId);

  try {
    // عدد المنتجات في المتجر
    const productsCount = await DeliveryProduct.countDocuments({
      store: storeObjectId,
      ...(start ? { createdAt: { $gte: start } } : {}),
    });

    // عدد الطلبات التي تحتوي عناصر من هذا المتجر
    const ordersMatch: any = {
      "items.store": storeObjectId,
      ...(start ? { createdAt: { $gte: start } } : {}),
    };

    const ordersCountAgg = await Order.aggregate([
      { $match: ordersMatch },
      { $count: "count" },
    ]);
    const ordersCount = ordersCountAgg[0]?.count ?? 0;

    // إيراد هذا المتجر فقط (من عناصره)
    // نفترض أن الإيراد = sum(items.unitPrice * items.quantity) لعناصر هذا المتجر
    const revenueAgg = await Order.aggregate([
      { $match: ordersMatch },
      { $unwind: "$items" },
      { $match: { "items.store": storeObjectId } },
      {
        $group: {
          _id: null,
          total: {
            $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] },
          },
        },
      },
    ]);
    const totalRevenue = revenueAgg[0]?.total ?? 0;

    res.json({ productsCount, ordersCount, totalRevenue });
    return;
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Server error" });
    return;
  }
});

export default router;
