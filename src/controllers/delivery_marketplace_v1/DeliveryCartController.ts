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

export const addOrUpdateCart = async (req: Request, res: Response) => {
  try {
    console.log("🔴 BODY FULL:", req.body);

    // 1. استخراج العناصر
    let itemsArr = req.body.items || [];
    let cartId = req.body.cartId;
    let note = req.body.note; // استخرج الملاحظة

    // 2. معالجة حالة الإرسال الفردي (حافظ على منطق التوافق)
    if (!Array.isArray(itemsArr)) {
      const {
        productId,
        name,
        price,
        quantity,
        storeId: itemStoreId,
        store: itemStore,
        image,
      } = req.body;

      itemsArr = [
        {
          productId: productId || req.body.product,
          name,
          price,
          quantity,
          store: itemStoreId || itemStore,
          image,
        },
      ];
    }

    // 3. التحقق من صحة البيانات
    if (!itemsArr || itemsArr.length === 0) {
      res.status(400).json({ message: "items مطلوبة" });
      return;
    }

    const toObjectId = (v: any) => {
      if (!v) return undefined;
      return typeof v === "string" && mongoose.Types.ObjectId.isValid(v)
        ? new mongoose.Types.ObjectId(v)
        : v;
    };

    // 4. معالجة المستخدم - احصل على هوية المستخدم من Firebase UID أو من req.user.id
    const uid = (req as any).firebaseUser?.uid || (req as any).user?.id || null;

    let dbUser = null;
    if (uid) {
      dbUser = await User.findOne({ firebaseUID: uid }).select("_id");
    }

    const userObjId = dbUser?._id;

    // 5. تحويل المعرفات لكل عنصر
    const itemsMapped = itemsArr
      .map((it) => ({
        productId: toObjectId(it.productId || it.product || it.id),
        productType: it.productType || "deliveryProduct",
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        store: toObjectId(it.storeId || it.store),
        image: it.image,
      }))
      .filter((i) => i.productId && i.store);

    // 6. البحث عن السلة الحالية أو إنشاؤها/تحديثها
    const total = itemsMapped.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    console.log("🟢 سيتم حفظ الكارت بالقيم التالية:");
    console.log("user:", userObjId);
    console.log("items:", itemsMapped);

    // استخدم findOneAndUpdate مع upsert لربط السلة بالمستخدم
    const cartDoc = await DeliveryCart.findOneAndUpdate(
      userObjId ? { user: userObjId } : { cartId }, // لو مستخدم مسجل خذه، وإلا cartId للضيف
      {
        user: userObjId, // اربطها بالمستخدم عند التسجيل
        cartId: cartId || new mongoose.Types.ObjectId().toString(),
        items: itemsMapped,
        total,
        note,
      },
      { upsert: true, new: true }
    );

    // تحديث العناصر الموجودة إذا كانت السلة موجودة مسبقاً
    if (cartDoc.items.length > 0) {
      for (const newItem of itemsMapped) {
        const existingItemIndex = cartDoc.items.findIndex(
          (item) =>
            (item.productId?.toString() ?? "") ===
              (newItem.productId?.toString() ?? "") &&
            item.productType === newItem.productType
        );

        if (existingItemIndex !== -1) {
          cartDoc.items[existingItemIndex].quantity += newItem.quantity;
        } else {
          cartDoc.items.push(newItem);
        }
      }

      // إعادة حساب الإجمالي
      cartDoc.total = cartDoc.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      await cartDoc.save();
    }
    res.status(201).json({
      cart: cartDoc,
      cartId: cartDoc.cartId,
    });
  } catch (err: any) {
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
    const carts = await DeliveryCart.find().sort({ createdAt: -1 });
    res.json(carts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const getAbandonedCarts = async (_: Request, res: Response) => {
  try {
    const THIRTY_MINUTES_AGO = new Date(Date.now() - 30 * 60 * 1000);
    const carts = await DeliveryCart.find({
      createdAt: { $lt: THIRTY_MINUTES_AGO },
    });
    res.json(carts);
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
