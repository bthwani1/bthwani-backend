// src/controllers/orderRating.ts
import { Request, Response } from "express";
import DeliveryOrder from "../../models/delivry_Marketplace_V1/Order";

export const rateOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { company, order: orderRating, driver, comments } = req.body;

  // 1) تحقق من الطلب
  const order = await DeliveryOrder.findById(id);
  if (!order) {
res.status(404).json({ message: "الطلب غير موجود" });
    return;
  } 

  // 2) يجب أن يكون مُسلّمًا ولم يُقيَّم سابقًا
  if (order.status !== "delivered") {
     res.status(400).json({ message: "لا يمكن التقييم قبل التسليم" });
     return;
  }
  if (order.rating) {
     res.status(400).json({ message: "تم تقييم الطلب سابقًا" });
     return;
  }

  // 3) احفظ التقييم
  order.rating = {
    company,
    order: orderRating,
    driver,
    comments,
    ratedAt: new Date(),
  };

  await order.save();
   res.json({ message: "تم حفظ التقييم بنجاح", rating: order.rating });
   return;
};
