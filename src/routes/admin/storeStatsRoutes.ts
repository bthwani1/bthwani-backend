// src/routes/admin/storeStatsRoutes.ts
import { Router } from "express";
import { Types } from "mongoose";
import Order from "../../models/delivry_Marketplace_V1/Order";
import DeliveryProduct from "../../models/delivry_Marketplace_V1/DeliveryProduct";

const router = Router();

router.get(
  "/delivery/stores/:storeId/stats/:period",
  async (req, res) => {
    const { storeId, period } = req.params as { storeId: string; period: "daily" | "weekly" | "monthly" | "all" };

    // helper لحساب تاريخ البداية
    const now = new Date();
    let start: Date | undefined;
    if (period === "daily") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "weekly") {
      const day = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    } else if (period === "monthly") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filter: any = { store: new Types.ObjectId(storeId) };
    if (start) filter.createdAt = { $gte: start };

    // عدّ المنتجات
    const productsCount = await DeliveryProduct.countDocuments(filter);

    // عدّ الطلبات
    const ordersCount = await Order.countDocuments({
      "store._id": new Types.ObjectId(storeId),
      ...(start ? { createdAt: { $gte: start } } : {}),
    });

    // إجمالي الإيرادات من الطلبات (مجموعة)
    const revenueAgg = await Order.aggregate([
      { $match: { "store._id": new Types.ObjectId(storeId), ...(start ? { createdAt: { $gte: start } } : {}) } },
      { $group: { _id: null, total: { $sum: "$cost" } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total ?? 0;

    res.json({ productsCount, ordersCount, totalRevenue });
  }
);

export default router;
