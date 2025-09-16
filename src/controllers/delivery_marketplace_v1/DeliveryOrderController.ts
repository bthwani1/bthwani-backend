import { Request, Response } from "express";
import DeliveryOrder, {
  OrderStatus,
} from "../../models/delivery_marketplace_v1/Order";
import DeliveryCart from "../../models/delivery_marketplace_v1/DeliveryCart";
import { User } from "../../models/user";
import mongoose, { Types } from "mongoose";
import DeliveryStore from "../../models/delivery_marketplace_v1/DeliveryStore";
import Driver from "../../models/Driver_app/driver";
import { calculateDeliveryPrice } from "../../utils/deliveryPricing";
import { getDistance } from "geolib";
import PricingStrategy from "../../models/delivery_marketplace_v1/PricingStrategy";
import { getActor } from "../../utils/actor";
import { canTransition } from "../../constants/orderStatus";
import { pushStatusHistory } from "../../utils/orderHistory";
import { broadcastOrder } from "../../sockets/orderEvents";
import { postIfDeliveredOnce } from "../../accounting/hooks";
import { broadcastOffersForOrder } from "../../services/dispatch";
import { fetchActivePromotions } from "../../services/promotion/pricing.service";
import DeliveryProduct from "../../models/delivery_marketplace_v1/DeliveryProduct";
import MerchantProduct from "../../models/mckathi/MerchantProduct";
import { notifyOrder } from "../../services/order.notify";
import {
  captureOrder,
  holdForOrder,
  releaseOrder,
} from "../../services/walletOrder.service";
import { Coupon } from "../../models/Wallet_V8/coupon.model";
import { captureForOrder } from "../../services/holds";
// 👇 ضِف أعلى هذا الملف

type In = {
  productId: string;
  productType: "merchantProduct" | "deliveryProduct";
  store: mongoose.Types.ObjectId | string;
  quantity: number;
  price?: number;
};

export async function priceSingleCartItem(input: In, promos: any[]) {
  const { productId } = input;
  const storeId =
    typeof input.store === "string"
      ? new mongoose.Types.ObjectId(input.store)
      : input.store;

  let doc: any = null;
  let resolvedType: "merchantProduct" | "deliveryProduct" | null = null;

  // 1) جرّب النوع المُرسل أولاً
  if (input.productType === "merchantProduct") {
    doc = await MerchantProduct.findOne({
      _id: productId,
      store: storeId,
    }).lean();
    resolvedType = doc ? "merchantProduct" : null;
  } else {
    doc = await DeliveryProduct.findById(productId).lean();
    resolvedType = doc ? "deliveryProduct" : null;
  }

  // 2) Fallback: جرّب الكولكشن الأخرى إذا ما لقيت
  if (!doc) {
    // جرّب MerchantProduct
    const asMerchant = await MerchantProduct.findOne({
      _id: productId,
      store: storeId,
    }).lean();
    if (asMerchant) {
      doc = asMerchant;
      resolvedType = "merchantProduct";
    } else {
      // جرّب DeliveryProduct
      const asDelivery = await DeliveryProduct.findById(productId).lean();
      if (asDelivery) {
        doc = asDelivery;
        resolvedType = "deliveryProduct";
      }
    }
  }

  if (!doc || !resolvedType) {
    throw new Error(
      `العنصر غير موجود productId=${productId} type=${input.productType} store=${storeId}`
    );
  }

  // 3) حدد سعر الأصل
  const unitPriceOriginal = Number(doc.price) || Number(input.price) || 0;

  // 4) طبّق العروض (اترك منطقك الحالي كما هو)
  let unitPriceFinal = unitPriceOriginal;
  let appliedPromotion: any = undefined;
  // ... منطق اختيار أفضل عرض من promos إن وجد
  // unitPriceFinal = Math.max(0, unitPriceOriginal - discountAmount);

  return {
    unitPriceOriginal,
    unitPriceFinal,
    resolvedType, // مهم
    appliedPromotion, // لو عندك
  };
}

function sanitizeNotes(raw: any): any[] {
  const toNote = (v: any) => {
    if (typeof v === "string") {
      const body = v.trim();
      if (!body) return null;
      return {
        body,
        visibility: "internal",
        byRole: "system",
        createdAt: new Date(),
      };
    }
    if (v && typeof v === "object") {
      const body = (v.body ?? "").toString().trim();
      if (!body) return null;
      const visibility = v.visibility === "public" ? "public" : "internal";
      const byRole = [
        "customer",
        "admin",
        "store",
        "driver",
        "system",
      ].includes(v.byRole)
        ? v.byRole
        : "system";
      const byId = v.byId ?? undefined;
      const createdAt = v.createdAt ? new Date(v.createdAt) : new Date();
      return { body, visibility, byRole, byId, createdAt };
    }
    return null;
  };

  if (!Array.isArray(raw)) {
    const n = toNote(raw);
    return n ? [n] : [];
  }
  return raw.map(toNote).filter(Boolean) as any[];
}

export async function finalizeWalletOnDelivered(orderId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order: any = await DeliveryOrder.findById(orderId)
      .session(session)
      .select("user walletUsed cashDue paid status coupon");
    if (!order) throw new Error("Order not found");

    // التقط الحجز إن وُجد
    if (order.walletUsed > 0) {
      await captureForOrder(String(order.user), String(order._id), session);
    }

    // في حال لا يوجد مبلغ كاش متبقٍ اجعل الطلب مدفوعاً
    if (order.cashDue === 0) order.paid = true;

    await order.save({ session, validateModifiedOnly: true });
    await session.commitTransaction();
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

export async function rollbackWalletAndCoupon(orderId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order: any = await DeliveryOrder.findById(orderId)
      .session(session)
      .select("user coupon");
    if (!order) throw new Error("Order not found");

    // 1) فكّ الحجز
    await releaseOrder(String(order.user), String(order._id), session);

    // 2) إعادة عدّاد الكوبون (إن وُجد)
    if (order.coupon?.code) {
      const c = await Coupon.findOne({ code: order.coupon.code }).session(
        session
      );
      if (c) {
        c.usedCount = Math.max(0, (c.usedCount || 0) - 1);
        if (c.isUsed) c.isUsed = false;
        await c.save({ session });
      }
    }

    await session.commitTransaction();
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}
export const createOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // 1) التحقق من المستخدم (اعتمدنا توحيدًا على req.user!.id)
    const firebaseUID = (req as any).user?.id;
    if (!firebaseUID) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user = await User.findOne({ firebaseUID }).session(session);
    if (!user) throw new Error("المستخدم غير موجود");

    const orderId = new mongoose.Types.ObjectId();

    // 2) السلة
    const cart = await DeliveryCart.findOne({ user: user._id }).session(
      session
    );
    if (!cart || cart.items.length === 0) throw new Error("السلة فارغة");

    // 3) بيانات الادخال
    let {
      scheduledFor,
      addressId,
      notes,
      paymentMethod,
      deliveryMode = "split",
      couponCode, // يمكن أن يأتي باسم couponCode
      coupon, // أو coupon
      errand, // بيانات الطلب من نوع errand
    } = req.body;

    // alias: cod -> cash
    if (paymentMethod === "cod") paymentMethod = "cash";

    if (scheduledFor && new Date(scheduledFor) <= new Date()) {
      throw new Error("الوقت المجدوَل يجب أن يكون في المستقبل.");
    }

    // 4) عنوان التوصيل
    const targetId = addressId || user.defaultAddressId?.toString();
    const chosenAddress = user.addresses.find(
      (a) => a._id.toString() === targetId
    );
    if (!chosenAddress || !chosenAddress.location)
      throw new Error("العنوان غير صالح");

    // 5) تجميع العناصر حسب المتجر
    const grouped: Record<string, typeof cart.items> = {};
    for (const item of cart.items) {
      const key = item.store.toString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    // 6) استراتيجية التسعير
    const strategy = await PricingStrategy.findOne({}).session(session);
    if (!strategy) throw new Error("استراتيجية التسعير غير مكوَّنة");

    // 7) رسوم التوصيل
    let deliveryFee = 0;
    const stores = Object.keys(grouped);
    if (deliveryMode === "unified") {
      const s = await DeliveryStore.findById(stores[0]).session(session);
      if (!s) throw new Error("المتجر غير موجود");
      const distKm =
        getDistance(
          { latitude: s.location.lat, longitude: s.location.lng },
          {
            latitude: chosenAddress.location.lat,
            longitude: chosenAddress.location.lng,
          }
        ) / 1000;
      deliveryFee = calculateDeliveryPrice(distKm, strategy);
    } else {
      for (const storeId of stores) {
        const s = await DeliveryStore.findById(storeId).session(session);
        if (!s) throw new Error(`المتجر ${storeId} غير موجود`);
        const distKm =
          getDistance(
            { latitude: s.location.lat, longitude: s.location.lng },
            {
              latitude: chosenAddress.location.lat,
              longitude: chosenAddress.location.lng,
            }
          ) / 1000;
        deliveryFee += calculateDeliveryPrice(distKm, strategy);
      }
    }

    // 8) العروض الفاعلة
    const promos = await fetchActivePromotions({
      city: chosenAddress.city,
      channel: "app",
    });

    // 9) subOrders + إعادة تسعير العناصر
    let commonDriver: any = null;
    if (deliveryMode === "unified") {
      const origin = await DeliveryStore.findById(stores[0]).session(session);
      if (origin) {
        commonDriver = await mongoose
          .model("Driver")
          .findOne({
            status: "active",
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [origin.location.lng, origin.location.lat],
                },
                $maxDistance: 5000,
              },
            },
          })
          .session(session);
      }
    }

    const subOrders = await Promise.all(
      stores.map(async (storeId) => {
        const items = grouped[storeId];
        const pricedItems: any[] = [];
        let subTotal = 0;
        const subAppliedPromos: any[] = [];

        for (const i of items) {
          const priced = await priceSingleCartItem(
            {
              productId: i.productId.toString(),
              productType: (i.productType as any) || "deliveryProduct",
              store: i.store,
              quantity: i.quantity,
              price: i.price,
            },
            promos
          );

          const lineTotal = priced.unitPriceFinal * i.quantity;
          subTotal += lineTotal;

          if (priced.appliedPromotion) {
            subAppliedPromos.push({
              promoId: priced.appliedPromotion.promoId,
              title: priced.appliedPromotion.title,
              amount: priced.appliedPromotion.amount * i.quantity,
              target: priced.appliedPromotion.target,
            });
          }

          pricedItems.push({
            product: i.productId,
            productType: priced.resolvedType, // ← استخدم النوع الفعلي
            quantity: i.quantity,
            unitPrice: priced.unitPriceFinal,
            unitPriceOriginal: priced.unitPriceOriginal,
            appliedPromotion: priced.appliedPromotion || undefined,
          });
        }

        let driver = commonDriver;
        if (!driver) {
          const s = await DeliveryStore.findById(storeId).session(session)!;
          driver = await mongoose
            .model("Driver")
            .findOne({
              status: "active",
              location: {
                $near: {
                  $geometry: {
                    type: "Point",
                    coordinates: [s.location.lng, s.location.lat],
                  },
                  $maxDistance: 5000,
                },
              },
            })
            .session(session);
        }

        return {
          store: storeId,
          items: pricedItems,
          driver: driver?._id || null,
          status: "pending_confirmation" as const,
          subTotal,
          subAppliedPromos,
        };
      })
    );

    // 10) الحصص
    let totalCompanyShare = 0;
    let totalPlatformShare = 0;
    for (const so of subOrders) {
      const s = await DeliveryStore.findById(so.store).session(session);
      if (!s) continue;
      const subTotal = so.items.reduce(
        (sum: number, it: any) => sum + it.quantity * it.unitPrice,
        0
      );
      const rate = s.takeCommission ? s.commissionRate : 0;
      const companyShare = subTotal * rate;
      totalCompanyShare += companyShare;
      totalPlatformShare += subTotal - companyShare;
    }

    // 11) إجمالي السلع
    let itemsTotal = subOrders.reduce(
      (sum: number, so: any) =>
        sum +
        so.items.reduce(
          (s: number, it: any) => s + it.quantity * it.unitPrice,
          0
        ),
      0
    );

    // 12) تطبيق الكوبون (اختياري)
    const incomingCouponCode = (couponCode || coupon || "").toString().trim();
    let couponApplied: null | {
      code: string;
      type: "percentage" | "fixed" | "free_shipping";
      value: number;
      discountOnItems: number;
      discountOnDelivery: number;
      appliedAt: Date;
    } = null;

    if (incomingCouponCode) {
      const c = await Coupon.findOne({ code: incomingCouponCode }).session(
        session
      );
      if (!c) throw new Error("الكوبون غير موجود");
      if (c.expiryDate < new Date()) throw new Error("انتهت صلاحية الكوبون");
      if (c.assignedTo && String(c.assignedTo) !== String(user._id)) {
        throw new Error("الكوبون غير مخصص لهذا المستخدم");
      }
      if (c.usageLimit && c.usedCount >= c.usageLimit) {
        throw new Error("تم استخدام الكوبون بالكامل");
      }

      let discountOnItems = 0;
      let discountOnDelivery = 0;

      if (c.type === "percentage") {
        discountOnItems = +(itemsTotal * (c.value / 100)).toFixed(2);
      } else if (c.type === "fixed") {
        discountOnItems = Math.min(c.value, itemsTotal);
      } else if (c.type === "free_shipping") {
        discountOnDelivery = deliveryFee;
      }

      itemsTotal = Math.max(0, +(itemsTotal - discountOnItems).toFixed(2));
      deliveryFee = Math.max(0, +(deliveryFee - discountOnDelivery).toFixed(2));

      couponApplied = {
        code: c.code,
        type: c.type as any,
        value: c.value,
        discountOnItems,
        discountOnDelivery,
        appliedAt: new Date(),
      };

      // حجز الاستخدام داخل نفس الـ session
      c.usedCount = (c.usedCount || 0) + 1;
      if (c.usageLimit && c.usedCount >= c.usageLimit) c.isUsed = true;
      await c.save({ session });
    }

    // 13) الإجمالي النهائي
    const totalPrice = itemsTotal + deliveryFee;

    // 14) أثر العروض المطبَّق على مستوى الطلب (اختياري)
    const appliedPromotions: any[] = [];
    for (const so of subOrders) {
      if (Array.isArray(so.subAppliedPromos))
        appliedPromotions.push(...so.subAppliedPromos);
    }

    // 15) محفظة/كاش (حجز وليس خصم)
    const wallet = {
      balance: Number((user as any).wallet?.balance ?? 0),
      onHold: Number((user as any).wallet?.onHold ?? 0),
    };

    let walletUsed = 0;

    // استخدم المحفظة فقط مع wallet أو mixed
    if (paymentMethod === "wallet" || paymentMethod === "mixed") {
      const available = Math.max(0, wallet.balance - wallet.onHold);
      walletUsed = Math.min(available, totalPrice);
    } else {
      walletUsed = 0; // cash / card
    }

    const cashDue = +(totalPrice - walletUsed).toFixed(2);

    if (walletUsed > 0) {
      await holdForOrder(
        String(user._id),
        String(orderId),
        walletUsed,
        session
      );
    }

    let finalPaymentMethod: "wallet" | "cash" | "card" | "mixed" = "cash";
    if (walletUsed > 0 && cashDue > 0) finalPaymentMethod = "mixed";
    else if (walletUsed > 0 && cashDue === 0) finalPaymentMethod = "wallet";

    // معالجة بيانات errand مع geo (إن وُجدت)
    let errandData = undefined;
    if (errand) {
      const pickupGeo = errand?.pickup?.location
        ? {
            type: "Point" as const,
            coordinates: [
              errand.pickup.location.lng,
              errand.pickup.location.lat,
            ] as [number, number],
          }
        : undefined;

      const dropoffGeo = errand?.dropoff?.location
        ? {
            type: "Point" as const,
            coordinates: [
              errand.dropoff.location.lng,
              errand.dropoff.location.lat,
            ] as [number, number],
          }
        : undefined;

      errandData = {
        ...errand,
        pickup: {
          ...errand.pickup,
          geo: pickupGeo ?? undefined, // لا تنشئ geo إن ما فيه إحداثيات
        },
        dropoff: {
          ...errand.dropoff,
          geo: dropoffGeo ?? undefined,
        },
      };
    }

    const order = new DeliveryOrder({
      _id: orderId,
      user: user._id,
      deliveryMode,
      scheduledFor: scheduledFor || null,
      address: {
        label: chosenAddress.label,
        street: chosenAddress.street,
        city: chosenAddress.city,
        location: {
          lat: chosenAddress.location.lat,
          lng: chosenAddress.location.lng,
        },
      },
      subOrders,
      deliveryFee,
      price: totalPrice,
      itemsTotal,
      companyShare: totalCompanyShare,
      platformShare: totalPlatformShare,
      walletUsed,
      cashDue,
      paymentMethod: finalPaymentMethod,
      status: "pending_confirmation",
      paid: cashDue === 0, // ✅ إصلاح
      appliedPromotions,
      coupon: couponApplied || undefined, // ✅ خزّن أثر الكوبون
      pricesFrozenAt: new Date(),
      notes: sanitizeNotes(notes),
      orderType: errand ? "errand" : "marketplace",
      errand: errandData,
    });

    await order.save({ session });
    await DeliveryCart.deleteOne({ _id: cart._id }).session(session);

    await session.commitTransaction();

    broadcastOrder("order.created", order._id.toString(), {
      status: order.status,
      price: order.price,
      city: order.address.city,
      subCount: order.subOrders.length,
    });
    await notifyOrder("order.created", order);

    res.status(201).json(order);
    return;
  } catch (err: any) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
    return;
  } finally {
    session.endSession();
  }
};
export const assignDriver = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.body;
    const { id } = req.params;

    const order = await DeliveryOrder.findById(id)
      .populate({ path: "user", select: "fullName phone" })
      .populate({ path: "driver", select: "fullName phone" })
      .populate({ path: "subOrders.store", select: "name logo address" })
      .populate({ path: "subOrders.driver", select: "fullName phone" });

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const actor = getActor(req);
    if (actor.role !== "admin") {
      res.status(403).json({ message: "Admin only" });
      return;
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      res.status(404).json({ message: "Driver not found" });
      return;
    }

    // 👇 عالج notes قبل أي حفظ
    order.notes = sanitizeNotes(order.notes);

    order.driver = driver.id as Types.ObjectId;
    order.status = "assigned"; // 👈 اجعلها حالة إسناد (لو مدعومة عندك)
    order.assignedAt = new Date();
    order.statusHistory.push({
      status: "assigned",
      changedAt: new Date(),
      changedBy: "admin",
    });

    // ملاحظة نظامية
    await notifyOrder("order.assigned", order, { driverId });

    await order.save({ validateModifiedOnly: true });
    broadcastOrder("order.driver.assigned", order._id.toString(), { driverId });

    res.json(order);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const assignDriverToSubOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, subId } = req.params as any;
    const { driverId } = req.body;

    const actor = getActor(req);
    if (actor.role !== "admin" && actor.role !== "store") {
      res.status(403).json({ message: "Forbidden" });

      return;
    }

    const order: any = await DeliveryOrder.findById(orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const sub = order.subOrders.id(subId);
    if (!sub) {
      res.status(404).json({ message: "SubOrder not found" });
      return;
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      res.status(404).json({ message: "Driver not found" });
      return;
    }

    sub.driver = driver._id;
    await order.save();
    broadcastOrder("order.sub.driver.assigned", order._id.toString(), {
      subId,
      driverId,
    });
    await notifyOrder("order.assigned", order, { driverId });

    res.json(order);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const updateSubOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId, subId } = req.params as any;
    const { status, reason, returnBy } = req.body as {
      status: OrderStatus;
      reason?: string;
      returnBy?: string;
    };

    const actor = getActor(req);
    if (!["admin", "store", "driver"].includes(actor.role)) {
      res.status(403).json({ message: "Forbidden" });

      return;
    }

    const order: any = await DeliveryOrder.findById(orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const sub = order.subOrders.id(subId);
    if (!sub) {
      res.status(404).json({ message: "SubOrder not found" });
      return;
    }

    // حارس الانتقال لــ subOrder
    if (!canTransition(sub.status, status as any)) {
      res.status(400).json({
        message: `Invalid transition from ${sub.status} to ${status}`,
      });
      return;
    }

    // حدّث subOrder
    pushStatusHistory(
      sub,
      status as any,
      actor.role as any,
      reason,
      returnBy as any
    );

    // يمكنك أيضًا مزامنة حالة order العليا (اختياريًا):
    // مثال: إذا كل subOrders = delivered → order.status=delivered
    if (order.subOrders.every((s: any) => s.status === "delivered")) {
      pushStatusHistory(order, "delivered", "admin");
      await notifyOrder("order.delivered", order);
      // 👇 Capture
      const s = await mongoose.startSession();
      s.startTransaction();
      try {
        await captureOrder(String(order.user), String(order._id), s);
        await s.commitTransaction();
      } catch (e: any) {
        await s.abortTransaction();
        console.error("Capture failed:", e.message);
      } finally {
        s.endSession();
      }
    }

    await order.save();
    broadcastOrder("order.sub.status", order._id.toString(), {
      subId,
      status,
      by: getActor(req).role,
    });
    try {
      await postIfDeliveredOnce(order);
    } catch (e) {
      console.error(
        "Accounting posting failed (updateSubOrderStatus):",
        (e as Error).message
      );
    }

    res.json(order);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
export const setOrderPOD = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { deliveryReceiptNumber } = req.body;

    const actor = getActor(req);
    if (!["admin", "driver"].includes(actor.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const order = await DeliveryOrder.findById(id)
      .populate({ path: "user", select: "fullName phone" })
      .populate({ path: "driver", select: "fullName phone" })
      .populate({ path: "subOrders.store", select: "name logo address" })
      .populate({ path: "subOrders.driver", select: "fullName phone" });

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    order.deliveryReceiptNumber = deliveryReceiptNumber;
    await order.save();
    broadcastOrder("order.pod.set", id, { deliveryReceiptNumber });

    res.json(order);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
export const addOrderNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { body, visibility = "internal" } = req.body as {
      body: string;
      visibility?: "public" | "internal";
    };

    if (!body?.trim()) {
      res.status(400).json({ message: "note body required" });
      return;
    }

    const actor = getActor(req);

    // العميل لا يُسمح له بإنشاء internal
    if (actor.role === "customer" && visibility !== "public") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // لو أردت منع vendor/driver من public: عدّل الشرط أعلاه كما تريد

    const order = await DeliveryOrder.findById(id)
      .populate({ path: "user", select: "fullName phone" })
      .populate({ path: "driver", select: "fullName phone" })
      .populate({ path: "subOrders.store", select: "name logo address" })
      .populate({ path: "subOrders.driver", select: "fullName phone" });

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const note = {
      body: body.trim(),
      visibility,
      byRole: actor.role,
      byId: actor.id,
      createdAt: new Date(),
    };

    order.notes.push(note as any);
    await order.save();
    broadcastOrder("order.note.added", id, {
      visibility,
      by: getActor(req).role,
    });

    res.status(201).json(order.notes[order.notes.length - 1]);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const listOrderNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getActor(req);
    const scope = (req.query.visibility as string) || "auto"; // auto = حسب الدور

    const order = await DeliveryOrder.findById(id)
      .populate({ path: "user", select: "fullName phone" })
      .populate({ path: "driver", select: "fullName phone" })
      .populate({ path: "subOrders.store", select: "name logo address" })
      .populate({ path: "subOrders.driver", select: "fullName phone" });
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    let notes = order.notes || [];

    if (scope === "public")
      notes = notes.filter((n: any) => n.visibility === "public");
    else if (scope === "internal")
      notes = notes.filter((n: any) => n.visibility === "internal");
    else {
      // auto
      if (actor.role === "customer") {
        notes = notes.filter((n: any) => n.visibility === "public");
      }
    }

    res.json(notes);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
export const setSubOrderPOD = async (req: Request, res: Response) => {
  try {
    const { orderId, subId } = req.params;
    const { deliveryReceiptNumber } = req.body;

    const actor = getActor(req);
    if (!["admin", "driver", "store"].includes(actor.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const order = await DeliveryOrder.findById(orderId)
      .populate({ path: "user", select: "fullName phone" })
      .populate({ path: "driver", select: "fullName phone" })
      .populate({ path: "subOrders.store", select: "name logo address" })
      .populate({ path: "subOrders.driver", select: "fullName phone" });
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const sub = order.subOrders.find((s: any) => s._id.toString() === subId);
    if (!sub) {
      res.status(404).json({ message: "SubOrder not found" });
      return;
    }

    sub.deliveryReceiptNumber = deliveryReceiptNumber;
    await order.save();
    broadcastOrder("order.sub.pod.set", orderId, {
      subId,
      deliveryReceiptNumber,
    });

    res.json(order);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

// PUT /orders/:id/vendor-accept
export const vendorAcceptOrder = async (req: Request, res: Response) => {
  const order = await DeliveryOrder.findById(req.params.id)
    .populate({ path: "user", select: "fullName phone" })
    .populate({ path: "driver", select: "fullName phone" })
    .populate({ path: "subOrders.store", select: "name logo address" })
    .populate({ path: "subOrders.driver", select: "fullName phone" });
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  if (!canTransition(order.status, "preparing")) {
    res.status(400).json({
      message: `Invalid transition from ${order.status} to preparing`,
    });
    return;
  }

  // ✅ اسناد سائق
  if (order.deliveryMode === "unified") {
    const store = await DeliveryStore.findById(order.subOrders[0].store);
    if (!store) {
      res.status(404).json({ message: "Store not found" });
      return;
    }

    const driver = await Driver.findOne({
      isAvailable: true,
      isBanned: false,
      $or: [
        { isJoker: false },
        {
          isJoker: true,
          jokerFrom: { $lte: new Date() },
          jokerTo: { $gte: new Date() },
        },
      ],
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [store.location.lng, store.location.lat],
          },
          $maxDistance: 5000,
        },
      },
    });

    if (!driver) {
      res.status(400).json({ message: "No available driver nearby" });
      return;
    }

    order.driver = driver._id as Types.ObjectId; // 👈 اسناد فعلي
    if (!order.assignedAt) order.assignedAt = new Date();
  } else {
    // split: اسناد لكل subOrder
    for (const sub of order.subOrders) {
      if (sub.driver) continue;
      const s = await DeliveryStore.findById(sub.store);
      if (!s) continue;

      const drv = await Driver.findOne({
        isAvailable: true,
        isBanned: false,
        currentLocation: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [s.location.lng, s.location.lat],
            },
            $maxDistance: 5000,
          },
        },
      });
      if (drv) sub.driver = drv._id as Types.ObjectId; // 👈 اسناد السائق للـ subOrder
    }
    if (!order.assignedAt) order.assignedAt = new Date();
  }

  // الحالة: المتجر بدأ التحضير
  pushStatusHistory(order, "preparing", "store");
  await notifyOrder("order.preparing", order);

  // ⚠️ لو عندك مشكلة موروثة في notes:
  // order.notes = sanitizeNotes(order.notes);
  await order.save({ validateModifiedOnly: true });

  res.json(order);
};

export const exportOrdersToExcel = async (req, res: Response) => {
  try {
    const ExcelJS = require("exceljs");
    const orders = await DeliveryOrder.find()
      .populate({ path: "user", select: "fullName phone" })
      .lean();

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    // Define columns
    worksheet.columns = [
      { header: "Order ID", key: "orderId", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Date", key: "date", width: 20 },
    ];

    // Add data rows
    orders.forEach((order) => {
      worksheet.addRow({
        orderId: order._id.toString(),
        status: order.status,
        customer: (order.user as any)?.fullName || "",
        phone: (order.user as any)?.phone || "",
        amount: order.price,
        date: new Date(order.createdAt).toLocaleString("ar-YE"),
      });
    });

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCCCCCC" },
    };

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="orders-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx"`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({ message: "فشل التصدير", error: error.message });
  }
};

// PATCH /orders/:id/admin-status
export const adminChangeStatus = async (req: Request, res: Response) => {
  const { status, reason, returnBy } = req.body;
  const validStatuses = [
    "pending_confirmation",
    "under_review",
    "preparing",
    "out_for_delivery",
    "delivered",
    "returned",
    "cancelled",
    "assigned", // 👈 لو أضفتها في الـ enum العام
  ];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ message: "حالة غير صحيحة" });
    return;
  }

  const update: any = {
    $set: { status },
    $push: {
      statusHistory: { status, changedAt: new Date(), changedBy: "admin" },
    },
  };

  if (status === "assigned") {
    update.$set.assignedAt = new Date();
  }

  if (status === "returned" || status === "cancelled") {
    update.$set.returnReason = reason || "بدون تحديد";
    update.$set.returnBy = returnBy || "admin";
  } else {
    update.$unset = { returnReason: "", returnBy: "" };
  }

  const order = await DeliveryOrder.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
    context: "query",
  });

  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  if (status === "preparing") {
    try {
      // ابث عروض لأقرب 5
      await broadcastOffersForOrder(order._id.toString(), 2); // 2 دقيقة صلاحية العرض
    } catch (e) {
      console.error("Broadcast offers error:", (e as Error).message);
    }
  }
  // ⚠️ لا تعيد تعديل/حفظ الوثيقة هنا
  try {
    await postIfDeliveredOnce(order);
  } catch (e) {
    console.error(
      "Accounting posting failed (adminChangeStatus):",
      (e as Error).message
    );
  }

  await notifyOrder(status as any, order);

  broadcastOrder("order.status", order._id.toString(), {
    status,
    by: getActor(req).role,
  });

  res.json(order);
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const firebaseUID = (req as any).user?.id;
    if (!firebaseUID) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findOne({ firebaseUID }).exec();
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const orderId = req.params.id;
    const order: any = await DeliveryOrder.findOne({
      _id: orderId,
      user: user._id,
    });
    if (!order) {
      res.status(404).json({ message: "Order not found or not yours" });
      return;
    }

    if (!canTransition(order.status, "cancelled")) {
      res.status(400).json({ message: "Cannot cancel at this stage" });
      return;
    }

    pushStatusHistory(
      order,
      "cancelled",
      "customer",
      "User cancelled",
      "customer"
    );
    await order.save({ validateModifiedOnly: true });
    await notifyOrder("order.cancelled", order);

    // إطلاق الحجز + فك حجز الكوبون داخل session
    const s = await mongoose.startSession();
    s.startTransaction();
    try {
      // 1) إطلاق حجز المحفظة
      await releaseOrder(String(order.user), String(order._id), s);

      // 2) تقليل usedCount للكوبون إن كان محجوزًا
      if (order.coupon?.code) {
        const c = await Coupon.findOne({ code: order.coupon.code }).session(s);
        if (c) {
          c.usedCount = Math.max(0, (c.usedCount || 0) - 1);
          if (c.isUsed) c.isUsed = false;
          await c.save({ session: s });
        }
      }

      await s.commitTransaction();
    } catch (e: any) {
      await s.abortTransaction();
      console.error("Release/Unuse coupon failed:", e.message);
    } finally {
      s.endSession();
    }

    res.json({ message: "Order cancelled", order });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getOrderNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getActor(req);
    const scope = (req.query.visibility as string) || "auto"; // "public" | "internal" | "auto"
    const sort = ((req.query.sort as string) || "asc").toLowerCase() as
      | "asc"
      | "desc";

    // العميل لا يُسمح له بقراءة ملاحظات طلب لا يملكه
    let query: any = { _id: id };
    if (actor.role === "customer") {
      const firebaseUID = (req as any).firebaseUser?.uid;
      const dbUser = await User.findOne({ firebaseUID }).select("_id");
      if (!dbUser) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      query.user = dbUser._id;
    }

    const order: any = await DeliveryOrder.findOne(query)
      .select("notes")
      .lean();
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    let notes = order.notes || [];

    // فلترة بحسب الـvisibility المطلوبة
    if (scope === "public") {
      notes = notes.filter((n: any) => n.visibility === "public");
    } else if (scope === "internal") {
      if (actor.role === "customer") {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
      notes = notes.filter((n: any) => n.visibility === "internal");
    } else {
      // auto: العميل يرى العامة فقط، والباقون يرون الكل
      if (actor.role === "customer") {
        notes = notes.filter((n: any) => n.visibility === "public");
      }
    }

    // ترتيب
    notes.sort((a: any, b: any) =>
      sort === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    notes = sanitizeNotes(notes);

    res.json(notes);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const docs = await DeliveryOrder.find({ user: userId })
      .populate({ path: "subOrders.store", select: "name logo city" })
      .sort({ createdAt: -1 })
      .lean();

    const out = docs.map((o) => {
      const stores = (o.subOrders || [])
        .map((so: any) => so.store)
        .filter(Boolean);

      // ✅ اشتقاق اسم المتجر المعروض
      let store = "—";
      let storeId = "—";
      let logo: string | undefined;

      if (stores.length === 1 && stores[0]?._id) {
        store = stores[0].name || "—";
        storeId = String(stores[0]._id);
        logo = stores[0].logo;
      } else if (stores.length > 1) {
        store = `عدة متاجر (${stores.length})`;
        storeId = "multi";
      } else if (o.orderType === "errand") {
        store = "اخدمني";
        storeId = "errand";
      }

      return {
        id: String(o._id),
        kind: o.orderType === "errand" ? "errand" : "marketplace",
        category: o.orderType === "errand" ? "اخدمني" : "المتاجر",
        rawStatus: o.status,
        status: translateStatus(o.status),
        date: toISODate(o.createdAt),
        time: toLocalTime(o.createdAt),
        monthKey: formatMonthKey(o.createdAt),

        // 👇 أهم شي نعيدها صح
        store,
        storeId,
        logo,

        address: o.address?.label || `${o.address?.city ?? ""}`,
        deliveryFee: o.deliveryFee ?? 0,
        discount: o.coupon?.discountOnItems ?? 0,
        total: o.price ?? 0,

        // إن كنت تبغى تختصر ولا ترجع السلة كاملة:
        basket: (o.items || []).slice(0, 3).map((it: any) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.unitPrice,
          originalPrice: it.unitPriceOriginal,
        })),

        notes: (o.notes || [])
          .filter((n: any) => n.visibility === "public")
          .map((n: any) => n.body),
      };
    });

    res.json(out);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
// POST /orders/:id/repeat
export const repeatOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const firebaseUID = (req as any).user?.id;
    if (!firebaseUID) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user = await User.findOne({ firebaseUID }).session(session);
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const oldOrder = await DeliveryOrder.findById(req.params.id).session(
      session
    );
    if (!oldOrder) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    if (oldOrder.user.toString() !== user._id.toString()) {
      res.status(403).json({ message: "Not your order" });
      return;
    }

    const strategy = await PricingStrategy.findOne().session(session);
    if (!strategy) throw new Error("استراتيجية التسعير غير مكوَّنة");

    // subOrders جديد بدون سائق، الحالة أولية، واحترام productType
    const subOrdersData = oldOrder.subOrders.map((so) => ({
      store: so.store,
      items: so.items.map((i: any) => ({
        product: i.product,
        productType: i.productType || "deliveryProduct",
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      driver: null,
      status: "pending_confirmation" as const,
    }));

    // رسوم التوصيل حسب عنوان الطلب القديم
    let deliveryFee = 0;
    for (const so of subOrdersData) {
      const store = await DeliveryStore.findById(so.store).session(session);
      if (!store) continue;
      const distKm =
        getDistance(
          { latitude: store.location.lat, longitude: store.location.lng },
          {
            latitude: oldOrder.address.location.lat,
            longitude: oldOrder.address.location.lng,
          }
        ) / 1000;
      deliveryFee += calculateDeliveryPrice(distKm, strategy);
    }

    // حصص
    let totalCompanyShare = 0;
    let totalPlatformShare = 0;
    for (const so of subOrdersData) {
      const store = await DeliveryStore.findById(so.store).session(session);
      if (!store) continue;
      const subTotal = so.items.reduce(
        (sum: number, it: any) => sum + it.quantity * it.unitPrice,
        0
      );
      const rate = store.takeCommission ? store.commissionRate : 0;
      const companyShare = subTotal * rate;
      totalCompanyShare += companyShare;
      totalPlatformShare += subTotal - companyShare;
    }

    const itemsTotal = subOrdersData.reduce(
      (sum: number, so: any) =>
        sum +
        so.items.reduce(
          (s: number, it: any) => s + it.quantity * it.unitPrice,
          0
        ),
      0
    );
    const totalPrice = itemsTotal + deliveryFee;

    const newOrder = new DeliveryOrder({
      user: user._id,
      deliveryMode: oldOrder.deliveryMode,
      scheduledFor: req.body.scheduledFor || null,
      address: oldOrder.address,
      subOrders: subOrdersData,
      deliveryFee,
      price: totalPrice,
      itemsTotal,
      companyShare: totalCompanyShare,
      platformShare: totalPlatformShare,
      notes: sanitizeNotes(oldOrder.notes),
      paymentMethod: "cash", // افتراضيًا كاش عند إعادة الطلب
      walletUsed: 0,
      cashDue: totalPrice,
      status: "pending_confirmation",
      paid: false,
    });

    await newOrder.save({ session });
    await session.commitTransaction();

    res.status(201).json(newOrder);
    return;
  } catch (err: any) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
    return;
  } finally {
    session.endSession();
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await DeliveryOrder.findById(req.params.id)
      .populate({ path: "user", select: "fullName name email phone" })
      .populate({ path: "driver", select: "fullName phone" })
      .populate({ path: "subOrders.store", select: "name logo address" })
      .populate({ path: "subOrders.driver", select: "fullName phone" })
      .populate({ path: "items.store", select: "name logo" });

    if (!order) {
      res.status(404).json({ message: "الطلب غير موجود" });
      return;
    }
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { status, city, storeId, driverId, from, to, paymentMethod } =
      req.query as any;

    const and: any[] = [];
    if (status) and.push({ status });
    if (city) and.push({ "address.city": city });
    if (paymentMethod) and.push({ paymentMethod });

    if (storeId) {
      and.push({
        $or: [{ "subOrders.store": storeId }, { "items.store": storeId }],
      });
    }

    if (driverId) {
      and.push({
        $or: [{ driver: driverId }, { "subOrders.driver": driverId }],
      });
    }

    if (from || to) {
      const range: any = {};
      if (from) range.$gte = new Date(from);
      if (to) range.$lte = new Date(to);
      and.push({ createdAt: range });
    }

    const filter = and.length ? { $and: and } : {};

    const orders = await DeliveryOrder.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "fullName name email phone" })
      .populate({ path: "driver", select: "fullName phone" })
      .populate({ path: "subOrders.store", select: "name logo address" })
      .populate({ path: "subOrders.driver", select: "fullName phone" })
      .populate({ path: "items.store", select: "name logo" });

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// تحديث الحالة - مخصص للسائق أو الأدمن فقط
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason, returnBy } = req.body as {
      status: OrderStatus;
      reason?: string;
      returnBy?: string;
    };

    const actor = getActor(req);
    if (!["admin", "driver", "store"].includes(actor.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const order = await DeliveryOrder.findById(id)
      .populate({ path: "user", select: "fullName phone" })
      .populate({ path: "driver", select: "fullName phone" })
      .populate({ path: "subOrders.store", select: "name logo address" })
      .populate({ path: "subOrders.driver", select: "fullName phone" });
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    if (!canTransition(order.status, status as any)) {
      res.status(400).json({
        message: `Invalid transition from ${order.status} to ${status}`,
      });
      return;
    }
    if (status === "assigned" && !order.assignedAt)
      order.assignedAt = new Date();

    pushStatusHistory(
      order,
      status as any,
      actor.role as any,
      reason,
      returnBy as any
    );
    await order.save();
    await notifyOrder(status as any, order);

    // ✅ محاسبة المحفظة حسب الحالة

    try {
      await postIfDeliveredOnce(order); // كما لديك
    } catch (e) {
      console.error(
        "Accounting posting failed (updateOrderStatus):",
        (e as Error).message
      );
    }

    broadcastOrder("order.status", order._id.toString(), {
      status,
      by: getActor(req).role,
    });

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// مساعدات بسيطة
function toISODate(d: Date | string) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(x.getDate()).padStart(2, "0")}`;
}

function toLocalTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("ar-YE", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMonthKey(d: Date | string) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
}

function translateStatus(s: string) {
  switch (s) {
    case "pending_confirmation":
      return "في انتظار التأكيد";
    case "under_review":
      return "قيد المراجعة";
    case "preparing":
      return "قيد التحضير";
    case "out_for_delivery":
      return "في الطريق";
    case "delivered":
      return "تم التوصيل";
    case "returned":
      return "تم الإرجاع";
    case "cancelled":
      return "أُلغي";
    case "awaiting_procurement":
      return "بانتظار الشراء";
    case "procured":
      return "تم الشراء";
    case "procurement_failed":
      return "تعذر الشراء";
    default:
      return s;
  }
}
