// services/order.notify.ts
import { sendToUsers } from "./push.service";
import { io } from "..";
import NotificationPreference from "../models/NotificationPreference";

type OrderEvent =
  | "order.created"
  | "order.assigned"
  | "order.preparing"
  | "order.out_for_delivery"
  | "order.delivered"
  | "order.cancelled"
  | "order.returned"
  | "order.note";

export async function notifyOrder(
  event: OrderEvent,
  order: any,
  extra?: Record<string, any>
) {
  const orderId = order._id.toString();
  const collapseId = `order:${orderId}:status`;

  const templates: Record<OrderEvent, { title: (o:any)=>string; body:(o:any)=>string }> = {
    "order.created": {
      title: o => `تم إنشاء طلبك #${o._id}`,
      body:  o => `المبلغ: ${o.price} ريال. بانتظار التأكيد.`
    },
    "order.assigned": {
      title: o => `تم إسناد كابتن لطلبك #${o._id}`,
      body:  o => `الكابتن في الطريق للمتجر.`
    },
    "order.preparing": {
      title: o => `المتجر يحضّر طلبك #${o._id}`,
      body:  o => `استعد، بنسلّمه للكابتن قريبًا.`
    },
    "order.out_for_delivery": {
      title: o => `طلبك #${o._id} في الطريق`,
      body:  o => `الكابتن متجه لعنوانك الآن.`
    },
    "order.delivered": {
      title: o => `تم تسليم طلبك #${o._id}`,
      body:  o => `يعطيك العافية! نرجو تقييم التجربة.`
    },
    "order.cancelled": {
      title: o => `تم إلغاء الطلب #${o._id}`,
      body:  o => `السبب: ${o.returnReason || "بدون تحديد"}.`
    },
    "order.returned": {
      title: o => `تم إرجاع الطلب #${o._id}`,
      body:  o => `تم الإرجاع بواسطة: ${o.returnBy || "النظام"}.`
    },
    "order.note": {
      title: _ => `تعليق جديد على طلبك`,
      body:  _ => `تمت إضافة ملاحظة جديدة.`
    },
  };

  const title = templates[event].title(order);
  const body  = templates[event].body(order);
  const data  = { type: event, orderId, ...(extra || {}) };

  // بثّ داخل التطبيق (Socket)
  io.to(`user_${order.user.toString()}`).emit("notification", { title, body, data, isRead:false, createdAt:new Date() });

  // احترم تفضيلات المستخدم
  const prefs = await NotificationPreference.findOne({ userId: order.user.toString() }).lean();
  if (prefs && prefs.orderUpdates === false) return;

  // دفع عبر Expo
  await sendToUsers([order.user.toString()], { title, body, data, collapseId }, ["user"]);
}
