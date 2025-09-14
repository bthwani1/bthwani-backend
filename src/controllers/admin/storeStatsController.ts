// src/controllers/admin/storeStatsController.ts
import { Types } from "mongoose";
import Order from "../../models/delivery_marketplace_v1/Order";
import DeliveryProduct from "../../models/delivery_marketplace_v1/DeliveryProduct";

/**
 * period: "daily" | "weekly" | "monthly"
 */
export async function getStoreStats(
  storeId: string,
  period: "daily" | "weekly" | "monthly"
) {
  const matchDate: any = {};
  const now = new Date();

  switch (period) {
    case "daily":
      matchDate.$gte = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      break;
    case "weekly": {
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - now.getDay());
      matchDate.$gte = firstDayOfWeek;
      break;
    }
    case "monthly":
      matchDate.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  // 1. عدد المنتجات في الكاتالوج الخاص بالمتجر
  const productsCount = await DeliveryProduct.countDocuments({
    store: new Types.ObjectId(storeId),
  });

  // 2. عدد الطلبات والإيرادات عبر التجميع
  const ordersAgg = await Order.aggregate([
    {
      $match: {
        store: new Types.ObjectId(storeId),
        createdAt: matchDate,
      },
    },
    {
      $group: {
        _id: null,
        ordersCount: { $sum: 1 },
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
  ]);

  const { ordersCount = 0, totalRevenue = 0 } = ordersAgg[0] || {};

  return { productsCount, ordersCount, totalRevenue };
}
