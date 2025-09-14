// src/controllers/orderDriver.ts
import { Request, Response } from "express";
import DeliveryOrder from "../../models/delivery_marketplace_v1/Order";

// 4. الدليفري يلتقط الطلب → إلى في الطريق إليك
export const driverPickUp = async (req: Request, res: Response) => {
  const order = await DeliveryOrder.findById(req.params.id);
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  if (order.status !== "preparing") {
    res.status(400).json({ message: "Cannot pick up at this stage" });
    return;
  }

  order.status = "out_for_delivery";
  order.statusHistory.push({
    status: "out_for_delivery",
    changedAt: new Date(),
    changedBy: "driver",
  });
  await order.save();
  res.json(order);
  return;
};

// 5. الدليفري يؤكد التسليم → إلى تم التوصيل
export const driverDeliver = async (req: Request, res: Response) => {
  const { receiptNumber } = req.body;
  if (!receiptNumber) {
    res.status(400).json({ message: "رقم السند مطلوب لتأكيد التسليم" });
    return;
  }

  const order = await DeliveryOrder.findById(req.params.id);
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  if (order.status !== "out_for_delivery") {
    res
      .status(400)
      .json({ message: "لا يمكن تأكيد التسليم في هذه الحالة الحالية" });
    return;
  }

  // خزّن رقم السند
  order.deliveryReceiptNumber = receiptNumber;

  // حرّك الحالة لـ delivered مع التسجيل في history
  order.status = "delivered";
  order.statusHistory.push({
    status: "delivered",
    changedAt: new Date(),
    changedBy: "driver",
  });

  await order.save();
  res.json(order);
  return;
};
