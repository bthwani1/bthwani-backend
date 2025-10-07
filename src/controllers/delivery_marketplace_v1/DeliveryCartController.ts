// controllers/delivry/DeliveryCartController.ts
import { Request, Response } from "express";
import DeliveryCart from "../../models/delivery_marketplace_v1/DeliveryCart";
import { User } from "../../models/user";
// @ts-ignore
import geolib, { getDistance } from "geolib";
import DeliveryStore from "../../models/delivery_marketplace_v1/DeliveryStore";
import PricingStrategy from "../../models/delivery_marketplace_v1/PricingStrategy";
import { calculateDeliveryPrice } from "../../utils/deliveryPricing";
import mongoose from "mongoose";

interface RemoveItemParams {
  cartId?: string;
  userId?: string;
  productId: string;
  productType: string;
}


const NEAR_STORE_KM = 3; // 👈 عدّل العتبة كما تريد

function km(a: {lat:number,lng:number}, b:{lat:number,lng:number}) {
  return getDistance(
    { latitude: a.lat, longitude: a.lng },
    { latitude: b.lat, longitude: b.lng }
  ) / 1000;
}

// =============== addOrUpdateCart ===============

export const addOrUpdateCart = async (req: Request, res: Response) => {
  try {
    let itemsArr = req.body.items || [];
    const cartIdInput = req.body.cartId;
    const note = req.body.note;

    if (!Array.isArray(itemsArr)) {
      const {
        productId, name, price, quantity,
        storeId: itemStoreId, store: itemStore, image, productType,
      } = req.body;
      itemsArr = [{
        productId: productId || req.body.product,
        productType: productType || "deliveryProduct",
        name, price, quantity, store: itemStoreId || itemStore, image,
      }];
    }
    if (!itemsArr?.length) {
      res.status(400).json({ message: "items مطلوبة" });
      return;
    }

    const toObjectId = (v:any) =>
      typeof v === "string" && mongoose.Types.ObjectId.isValid(v)
        ? new mongoose.Types.ObjectId(v) : v;

    const uid = (req as any).firebaseUser?.uid || (req as any).user?.id || null;
    const userDoc = uid ? await User.findOne({ firebaseUID: uid }).select("_id") : null;
    const userObjId = userDoc?._id;

    const itemsMapped = itemsArr
      .map((it:any) => ({
        productId: toObjectId(it.productId || it.product || it.id),
        productType: it.productType || "deliveryProduct",
        name: it.name,
        price: Number(it.price) || 0,
        quantity: Math.max(1, Number(it.quantity) || 1),
        store: toObjectId(it.storeId || it.store),
        image: it.image,
      }))
      .filter((i:any) => i.productId && i.store);

    if (!itemsMapped.length) {
       res.status(400).json({ message: "items غير صالحة" });
      return;
    } 

    // لا تسمح في نفس الطلب بأكثر من متجر جديد (لتبسيط القرار)
    const newStores = Array.from(new Set(itemsMapped.map((i:any) => String(i.store))));
    if (newStores.length > 1) {
      res.status(400).json({ message: "أرسل متجرًا واحدًا في كل إضافة" });
      return;
    }
    const newStoreId = newStores[0];

    const filter:any = userObjId ? { user: userObjId } : { cartId: String(cartIdInput || "") };
    let cartDoc = await DeliveryCart.findOne(filter);

    if (!cartDoc && !userObjId) {
      filter.cartId = String(cartIdInput || new mongoose.Types.ObjectId().toString());
    }

    // ⚠️ حارس القرب: إذا السلة فيها متاجر، تحقّق قرب المتجر الجديد منها
    if (cartDoc?.items?.length) {
      const existingStoreIds = Array.from(
        new Set(cartDoc.items.map((it:any) => String(it.store)))
      );

      // لو المتجر الجديد موجود أصلاً، نكمّل
      if (!existingStoreIds.includes(newStoreId as string)) {
        const stores = await DeliveryStore.find({
          _id: { $in: [...existingStoreIds, newStoreId] },
        }).select("location").lean();

        const byId: Record<string, any> = Object.fromEntries(
          stores.map((s:any) => [String(s._id), s])
        );

        const newStore = byId[newStoreId as string];
        if (!newStore?.location) {
          res.status(404).json({ message: "المتجر غير موجود" });
          return;
        }

        // أقل مسافة بين المتجر الجديد وكل متجر موجود
        let minKm = Infinity;
        for (const sid of existingStoreIds) {
          const st = byId[sid];
          if (!st?.location) continue;
          const d = km(
            { lat: newStore.location.lat, lng: newStore.location.lng },
            { lat: st.location.lat,  lng: st.location.lng }
          );
          minKm = Math.min(minKm, d);
        }

        if (!isFinite(minKm) || minKm > NEAR_STORE_KM) {
          res.status(409).json({
            code: "CART_STORE_TOO_FAR",
            message: "لا يمكن خلط متاجر بعيدة ضمن نفس السلة",
            nearestDistanceKm: isFinite(minKm) ? +minKm.toFixed(2) : null,
            thresholdKm: NEAR_STORE_KM,
            currentStores: existingStoreIds,
            newStore: newStoreId,
          });
          return;
        }
      }
    }

    // إنشاء السلة إن لم تكن موجودة
    if (!cartDoc) {
      cartDoc = await DeliveryCart.create({
        user: userObjId, cartId: filter.cartId, items: [], total: 0, note,
      });
    } else if (typeof note === "string") {
      cartDoc.note = note;
    }

    // دمج العناصر (productId + productType)
    for (const newItem of itemsMapped) {
      const idx = cartDoc.items.findIndex(
        (i:any) =>
          String(i.productId) === String(newItem.productId) &&
          i.productType === newItem.productType
      );
      if (idx >= 0) {
        cartDoc.items[idx].quantity += newItem.quantity;
      } else {
        cartDoc.items.push(newItem as any);
      }
    }

    cartDoc.total = cartDoc.items.reduce(
      (sum:number, it:any) => sum + (Number(it.price) || 0) * (it.quantity || 0), 0
    );
    await cartDoc.save();

    res.status(201).json({ cart: cartDoc, cartId: cartDoc.cartId });
  } catch (err:any) {
    res.status(500).json({ message: err.message });
  }
};


export const updateCartItemQuantity = async (req: Request, res: Response) => {
  try {
    const firebaseUID = (req as any).user?.id;
    if (!firebaseUID) {
          res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const productId = String(req.params.productId);
    // خذ الـ productType من body أو query أو params (احتياطي) أو اجعله افتراضيًا
    const productType = (req.body?.productType ||
      req.query?.productType ||
      (req.params as any)?.productType ||
      "deliveryProduct") as string;

    const { quantity } = req.body;
    if (typeof quantity !== "number" || quantity < 1) {
      res.status(400).json({ message: "Quantity must be ≥ 1" });
      return;
    }

    const user = await User.findOne({ firebaseUID }).exec();
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const cart = await DeliveryCart.findOne({ user: user._id });
    if (!cart) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    // ابحث أولاً بالمطابقة الكاملة (productId + productType)
    let idx = cart.items.findIndex(
      (i) =>
        (i.productId?.toString() ?? "") === productId &&
        i.productType === productType
    );

    // لو ما لقيته، جرّب مطابقة الـ productId فقط (احتياط)
    if (idx === -1) {
      idx = cart.items.findIndex(
        (i) => (i.productId?.toString() ?? "") === productId
      );
    }

    if (idx === -1) {
      res.status(404).json({ message: "Item not found in cart" });
      return;
    }

    cart.items[idx].quantity = quantity;

    // أعد حساب الإجمالي
    cart.total = cart.items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 0),
      0
    );

    await cart.save();
    res.json(cart);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// controllers/.../DeliveryCartController.ts
export const getCart = async (req: Request, res: Response) => {
  try {
    const { cartId, userId } = req.params as any;
    const u = (req as any).user?.id; // firebase UID إن وُجد
    const filter: any = {};

    if (cartId) {
      filter.cartId = cartId;
    } else if (userId) {
      // userId كمونغو ObjectId
      if (mongoose.Types.ObjectId.isValid(userId)) {
        filter.user = new mongoose.Types.ObjectId(userId);
      } else if (u) {
        // fallback: لو أرسلت uid بالخطأ في مكان userId
        const userDoc = await User.findOne({ firebaseUID: userId }).exec();
        if (!userDoc) {
          res.status(404).json({ message: "المستخدم غير موجود" });
          return;
        }
        filter.user = userDoc._id;
      } else {
        res.status(400).json({ message: "userId غير صالح" });
        return;
      }
    } else if (u) {
      const userDoc = await User.findOne({ firebaseUID: u }).exec();
      if (!userDoc) {
        res.status(404).json({ message: "المستخدم غير موجود" });
        return;
      }
      filter.user = userDoc._id;
    } else {
      res.status(400).json({ message: "cartId أو تسجيل الدخول مطلوب" });
      return;
    }

    const cart = await DeliveryCart.findOne(filter);
    if (!cart) {
      res.status(404).json({ message: "سلة فارغة" });
      return;
    }

    res.json(cart);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const { cartId } = req.params;
    let filter: any = {};
    if (req.params.cartId || req.body.cartId) {
      filter.cartId = req.params.cartId || req.body.cartId;
    } else if ((req as any).user?.id) {
      // المستخدم المسجّل
      const user = await User.findOne({
        firebaseUID: (req as any).user.id,
      }).exec();
      filter.user = user!._id; // الصحيح هنا user وليس userId
    } else {
      res.status(400).json({ message: "cartId أو تسجيل الدخول مطلوب" });
      return;
    }

    await DeliveryCart.findOneAndDelete(filter);
    res.json({ message: "تم حذف السلة بنجاح" });
    return;
  } catch (err: any) {
    res.status(500).json({ message: err.message });
    return;
  }
};
export const mergeCart = async (req: Request, res: Response) => {
  const userDoc = await User.findOne({
    firebaseUID: (req as any).user!.id,
  }).exec();
  if (!userDoc) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const guestItems = req.body.items as Array<{
    productId: string;
    quantity: number;
  }>;
  if (!Array.isArray(guestItems) || guestItems.length === 0) {
    res.status(400).json({ message: "لا توجد عناصر للدمج" });
    return;
  }

  // ابني أو حدّث السلة للمستخدم
  const cart = await DeliveryCart.findOneAndUpdate(
    { user: userDoc._id }, // الصحيح
    {
      $inc: { total: 0 },
      $setOnInsert: { user: userDoc._id },
      $push: { items: { $each: guestItems } },
    },
    { upsert: true, new: true }
  );
  res.json(cart);
  return;
};

export const getAllCarts = async (_: Request, res: Response) => {
  try {
    // 1) اجلب السلات كـ lean
    const rawCarts = await DeliveryCart.find().sort({ createdAt: -1 }).lean();

    // 2) جهّز خرائط المستخدمين والمتاجر
    const userIds = rawCarts.map((c:any) => c.user).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .select("name email phone")
      .lean();
    const userMap: Record<string, any> =
      Object.fromEntries(users.map((u:any) => [String(u._id), u]));

    const storeIds = Array.from(
      new Set(
        rawCarts.flatMap((c:any) => (c.items || []).map((i:any) => String(i.store)).filter(Boolean))
      )
    );
    const stores = await DeliveryStore.find({ _id: { $in: storeIds } })
      .select("name")
      .lean();
    const storeMap: Record<string, any> =
      Object.fromEntries(stores.map((s:any) => [String(s._id), s]));

    // 3) طبّع الرد إلى الشكل الذي تتوقعه الواجهة
    const normalized = rawCarts.map((c:any) => {
      const items = (c.items || []).map((it:any) => ({
        product: {
          _id: String(it.productId),
          name: it.name,
          image: it.image,
          price: Number(it.price) || 0,
        },
        quantity: Number(it.quantity) || 0,
      }));

      // متجر على مستوى السلة (إن كانت كل العناصر من نفس المتجر)
      const uniqueStoreIds = Array.from(new Set((c.items || []).map((it:any) => String(it.store))));
      const cartStore =
        uniqueStoreIds.length === 1
          ? {
              _id: uniqueStoreIds[0],
              name: storeMap[uniqueStoreIds[0] as string]?.name,
            }
          : undefined;

      return {
        _id: String(c._id),
        user: userMap[String(c.user)] || undefined, // {name,email,phone} إن وجد
        items,
        store: cartStore, // قد تكون undefined لو متاجر متعددة
        total: Number(c.total) || 0,
        createdAt: c.createdAt, // تُرسل كـ ISO من Mongoose
      };
    });

    res.json(normalized);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAbandonedCarts = async (_: Request, res: Response) => {
  try {
    const THIRTY_MINUTES_AGO = new Date(Date.now() - 30 * 60 * 1000);
    const rawCarts = await DeliveryCart.find({
      createdAt: { $lt: THIRTY_MINUTES_AGO },
    })
      .sort({ createdAt: -1 })
      .lean();

    // نفس خطوات التطبيع أعلاه
    const userIds = rawCarts.map((c:any) => c.user).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .select("name email phone")
      .lean();
    const userMap: Record<string, any> =
      Object.fromEntries(users.map((u:any) => [String(u._id), u]));

    const storeIds = Array.from(
      new Set(
        rawCarts.flatMap((c:any) => (c.items || []).map((i:any) => String(i.store)).filter(Boolean))
      )
    );
    const stores = await DeliveryStore.find({ _id: { $in: storeIds } })
      .select("name")
      .lean();
    const storeMap: Record<string, any> =
      Object.fromEntries(stores.map((s:any) => [String(s._id), s]));

    const normalized = rawCarts.map((c:any) => {
      const items = (c.items || []).map((it:any) => ({
        product: {
          _id: String(it.productId),
          name: it.name,
          image: it.image,
          price: Number(it.price) || 0,
        },
        quantity: Number(it.quantity) || 0,
      }));

      const uniqueStoreIds = Array.from(new Set((c.items || []).map((it:any) => String(it.store))));
      const cartStore =
        uniqueStoreIds.length === 1
          ? {
              _id: uniqueStoreIds[0],
              name: storeMap[uniqueStoreIds[0] as string]?.name,
            }
          : undefined;

      return {
        _id: String(c._id),
        user: userMap[String(c.user)] || undefined,
        items,
        store: cartStore,
        total: Number(c.total) || 0,
        createdAt: c.createdAt,
      };
    });

    res.json(normalized);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDeliveryFee = async (req: Request, res: Response) => {
  try {
    const { addressId, deliveryMode = "split", cartId } = req.query as any;

    // 🟢 اقرأ هوية Firebase من المكان الصحيح
    const uid = (req as any).firebaseUser?.uid || (req as any).user?.id || null;

    const user = uid ? await User.findOne({ firebaseUID: uid }) : null;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // العنوان
    const address = user.addresses.find(
      (a: any) => a._id.toString() === String(addressId)
    );
    if (!address) {
      res.status(400).json({ message: "عنوان غير صالح" });
      return;
    }

    // السلة للمستخدم؛ وإن ما وجِدت جرّب ضيف cartId
    let cart = await DeliveryCart.findOne({ user: user._id });
    if (!cart && cartId) {
      cart = await DeliveryCart.findOne({ cartId: String(cartId) });
    }
    if (!cart || !cart.items?.length) {
      res.status(400).json({ message: "السلة فارغة" });
      return;
    }

    const strategy = await PricingStrategy.findOne({});
    if (!strategy) throw new Error("Pricing strategy not configured");

    let fee = 0;

    if (deliveryMode === "unified") {
      // احسب أرخص تكلفة بين المتاجر الموجودة في السلة
      let minFee = Infinity;
      const distinctStores = [
        ...new Set(cart.items.map((i) => String(i.store))),
      ];
      for (const sid of distinctStores) {
        const s = await DeliveryStore.findById(sid);
        if (!s?.location) continue;
        const distKm =
          getDistance(
            { latitude: s.location.lat, longitude: s.location.lng },
            { latitude: address.location.lat, longitude: address.location.lng }
          ) / 1000;
        const f = calculateDeliveryPrice(distKm, strategy);
        if (f < minFee) minFee = f;
      }
      fee = isFinite(minFee) ? minFee : 0;
    } else {
      // split: اجمع رسوم كل متجر على حدة
      const grouped = cart.items.reduce((m: Record<string, any[]>, it: any) => {
        const k = String(it.store);
        (m[k] = m[k] || []).push(it);
        return m;
      }, {});
      for (const sid of Object.keys(grouped)) {
        const s = await DeliveryStore.findById(sid);
        if (!s?.location) continue;
        const distKm =
          getDistance(
            { latitude: s.location.lat, longitude: s.location.lng },
            { latitude: address.location.lat, longitude: address.location.lng }
          ) / 1000;
        fee += calculateDeliveryPrice(distKm, strategy);
      }
    }

    res.json({
      deliveryFee: Math.max(0, Math.round(fee)),
      cartTotal: cart.total ?? 0,
      grandTotal: (cart.total ?? 0) + (fee ?? 0),
    });
    return;
  } catch (err: any) {
    res.status(500).json({ message: err.message });
    return;
  }
};

export const removeItem = async (
  req: Request<RemoveItemParams>,
  res: Response
) => {
  try {
    const { cartId, userId, productId } = req.params as any;
    const productType =
      (req.query?.productType as string) ||
      (req.body?.productType as string) ||
      "deliveryProduct";

    const filter: any = {};

    if (userId) {
      // إن كان userId ObjectId صالحًا -> استخدمه مباشرة
      if (mongoose.Types.ObjectId.isValid(userId)) {
        filter.user = new mongoose.Types.ObjectId(userId);
      } else {
        // افترض أنه Firebase UID -> حوّله إلى ObjectId المستخدم
        const userDoc = await User.findOne({ firebaseUID: userId }).exec();
        if (!userDoc) {
          res.status(404).json({ message: "المستخدم غير موجود" });
          return;
        }
        filter.user = userDoc._id;
      }
    } else if (cartId) {
      filter.cartId = cartId;
    } else {
      res.status(400).json({ message: "userId أو cartId مطلوب" });
      return;
    }

    const cart = await DeliveryCart.findOne(filter);
    if (!cart) {
      res.status(404).json({ message: "سلة غير موجودة" });
      return;
    }

    // احذف بالمعرف والنوع (مع fallback لحذف بالمعرّف فقط إن لم يطابق النوع)
    const before = cart.items.length;
    cart.items = cart.items.filter(
      (i) =>
        !(
          (i.productId?.toString() ?? "") === (productId ?? "") &&
          (i.productType === productType || productType === "any")
        )
    );
    if (cart.items.length === before) {
      // احتياط: حاول حذف بالمُعرِّف فقط
      cart.items = cart.items.filter(
        (i) => (i.productId?.toString() ?? "") !== (productId ?? "")
      );
    }

    cart.total = cart.items.reduce(
      (sum, i) => sum + (Number(i.price) || 0) * (i.quantity || 0),
      0
    );
    await cart.save();
    res.json(cart);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
