// services/vendor/balance.service.ts
import Order from "../../models/delivery_marketplace_v1/Order";
import DeliveryStore from "../../models/delivery_marketplace_v1/DeliveryStore";
import SettlementRequest from "../../models/vendor_app/SettlementRequest";
import mongoose from "mongoose";

export async function computeVendorBalance(storeId: mongoose.Types.ObjectId) {
  // إجمالي مبيعات العناصر المسلّمة لهذا المتجر
  const salesAgg = await Order.aggregate([
    { $match: { status: "delivered", "subOrders.store": storeId } },
    { $unwind: "$subOrders" },
    { $match: { "subOrders.store": storeId, "subOrders.status": "delivered" } },
    { $unwind: "$subOrders.items" },
    {
      $group: {
        _id: null,
        gross: { $sum: { $multiply: ["$subOrders.items.unitPrice", "$subOrders.items.quantity"] } },
      },
    },
  ]);
  const gross = salesAgg[0]?.gross || 0;

  // عمولة المتجر (إن وجدت)
  const store = await DeliveryStore.findById(storeId).lean();
  const commissionRate = store?.commissionRate ?? 0; // كنسبة مئوية
  const commission = Math.round((gross * commissionRate) / 100);

  // إجمالي ما تم تحويله أو قيد التحويل
  const settlementsAgg = await SettlementRequest.aggregate([
    { $match: { store: storeId, status: { $in: ["pending", "completed"] } } },
    { $group: { _id: null, settled: { $sum: "$amount" } } },
  ]);
  const settled = settlementsAgg[0]?.settled || 0;

  const net = Math.max(gross - commission - settled, 0);
  return { gross, commissionRate, commission, settled, net };
}



