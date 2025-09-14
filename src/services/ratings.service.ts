// src/services/ratings.service.ts
import mongoose, { Types } from "mongoose";
import DeliveryOrder from "../models/delivery_marketplace_v1/Order";
import DeliveryStore from "../models/delivery_marketplace_v1/DeliveryStore";

function extractStoreIdsFromOrder(order: any): Types.ObjectId[] {
  const set = new Set<string>();

  // من items
  for (const it of order?.items ?? []) {
    if (it?.store) set.add(String(it.store));
  }

  // من subOrders (لو عندك split)
  for (const so of order?.subOrders ?? []) {
    if (so?.store) set.add(String(so.store));
  }

  return Array.from(set).map((id) => new mongoose.Types.ObjectId(id));
}

/**
 * يعيد حساب متوسط وعدد التقييمات الحقيقي لمتجر واحد
 * (فقط طلبات مُسلَّمة، لها rating، ونوعها marketplace)
 */
export async function recomputeAndSaveStoreRating(storeId: Types.ObjectId) {
  const [agg] = await DeliveryOrder.aggregate([
    {
      $match: {
        status: "delivered",
        orderType: "marketplace",
        rating: { $ne: null },
        $or: [{ "items.store": storeId }, { "subOrders.store": storeId }],
      },
    },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating.order" }, // تقييم المتجر
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = agg?.avg ?? 0;
  const count = agg?.count ?? 0;

  await DeliveryStore.findByIdAndUpdate(
    storeId,
    { $set: { rating: avg, ratingsCount: count } },
    { new: false }
  );
}

/**
 * بعد تقييم الطلب: حدّث جميع المتاجر المشاركة فيه.
 */
export async function updateStoresRatingsForOrder(order: any) {
  const storeIds = extractStoreIdsFromOrder(order);
  await Promise.all(storeIds.map((id) => recomputeAndSaveStoreRating(id)));
}
