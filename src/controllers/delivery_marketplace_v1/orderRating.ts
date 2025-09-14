// src/controllers/orderRating.ts
import { Request, Response } from "express";
import DeliveryOrder from "../../models/delivery_marketplace_v1/Order";
import { updateStoresRatingsForOrder } from "../../services/ratings.service";

export const rateOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { company, order: orderRating, driver, comments } = req.body;

  const order = await DeliveryOrder.findById(id);
  if (!order) {
    res.status(404).json({ message: "الطلب غير موجود" });
    return;
  }

  if (order.status !== "delivered") {
    res.status(400).json({ message: "لا يمكن التقييم قبل التسليم" });
    return;
  }
  if (order.rating) {
    res.status(400).json({ message: "تم تقييم الطلب سابقًا" });
    return;
  }

  order.rating = {
    company,
    order: orderRating,
    driver,
    comments,
    ratedAt: new Date(),
  };

  await order.save();

  // 🔁 بعد حفظ التقييم: أعد حساب تقييمات المتاجر المشاركة
  try {
    await updateStoresRatingsForOrder(order);
  } catch (e) {
    // لا تُفشل الرد على العميل، لكن سجّل الخطأ لتتبعه
    console.error("Failed to update store ratings for order:", order._id, e);
  }

  res.json({ message: "تم حفظ التقييم بنجاح", rating: order.rating });
};
