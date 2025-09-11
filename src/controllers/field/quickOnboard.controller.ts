// controllers/field/quickOnboard.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import DeliveryStore from "../../models/delivry_Marketplace_V1/DeliveryStore";
import Vendor from "../../models/vendor_app/Vendor";

import DeliveryCategory from "../../models/delivry_Marketplace_V1/DeliveryCategory"; // تأكد من وجود هذا الموديل

export const quickOnboard = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const { store, vendor, participants, idempotencyKey } = req.body;
    // هنا نحصل الـ uid الذي يضعه verifyMarketerJWT (decoded.id)
    const marketerId = (req.user as any)?.id;

    // تحقق من المدخلات الأساسية
    if (
      !store ||
      !store.name ||
      !store.address ||
      !store.category ||
      !store.location
    ) {
      res.status(400).json({
        message: "بيانات المتجر ناقصة (name, address, category, location)",
      });
      return;
    }
    if (!vendor || !vendor.fullName || !vendor.phone || !vendor.password) {
      res
        .status(400)
        .json({ message: "بيانات التاجر ناقصة (fullName, phone, password)" });
      return;
    }

    // تحقق من فئة المتجر موجودة في DB
    if (!mongoose.Types.ObjectId.isValid(store.category)) {
      res.status(400).json({ message: "category id غير صالح" });
      return;
    }
    const catExists = await DeliveryCategory.findById(store.category)
      .lean()
      .catch(() => null);
    if (!catExists) {
      res.status(400).json({ message: "الفئة (category) غير موجودة" });
      return;
    }

    // تأكد من وجود lat/lng أو حوّل من fields منفصلة
    let loc = store.location;
    if ((!loc?.lat && loc?.lat !== 0) || (!loc?.lng && loc?.lng !== 0)) {
      if (store.lat != null && store.lng != null) {
        loc = { lat: parseFloat(store.lat), lng: parseFloat(store.lng) };
      } else {
        res
          .status(400)
          .json({ message: "location غير صالح — مطلوب lat و lng" });
        return;
      }
    } else {
      loc = { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) };
    }
    if (Number.isNaN(loc.lat) || Number.isNaN(loc.lng)) {
      res.status(400).json({ message: "lat أو lng غير رقمي" });
      return;
    }

    // Idempotency: لو أعطيت مفتاح + uid، ابحث عن تكرار
    if (idempotencyKey && marketerId) {
      const dup = await DeliveryStore.findOne({
        createdByMarketerUid: marketerId,
        "meta.idempotencyKey": idempotencyKey,
      }).lean();
      if (dup) {
        res.status(200).json({ duplicated: true, storeId: dup._id });
        return;
      }
    }

    // تحقق من عدم تكرار التاجر (الهاتف أو الإيميل)
    const dupVendor = await Vendor.findOne({
      $or: [{ phone: vendor.phone }, { email: vendor.email }],
    }).lean();
    if (dupVendor) {
      res.status(409).json({ message: "يوجد تاجر بنفس الهاتف/البريد" });
      return;
    }

    // ابدأ معاملة تراكنشن
    await session.withTransaction(async () => {
      // أنشئ المتجر — ملاحظة: حوّل category إلى ObjectId
      const storeDoc = new DeliveryStore({
        name: store.name,
        address: store.address,
        category: new mongoose.Types.ObjectId(store.category),
        location: { lat: loc.lat, lng: loc.lng },
        geo: { type: "Point", coordinates: [loc.lng, loc.lat] },
        image: store.image || null,
        logo: store.logo || null,
        commissionRate: parseFloat(store.commissionRate) || 0,
        tags: Array.isArray(store.tags)
          ? store.tags
          : store.tags
          ? [store.tags]
          : [],
        isActive: true,
        forceClosed: true,
        createdByMarketerUid: marketerId,
        participants: Array.isArray(participants) ? participants : [],
        source: "marketerQuickOnboard",
        meta: { idempotencyKey },
      });
      await storeDoc.save({ session });

      // أنشئ التاجر غير مفعّل
      const hash = await bcrypt.hash(String(vendor.password), 10);
      const vendorDoc = new Vendor({
        fullName: vendor.fullName,
        phone: vendor.phone,
        email: vendor.email?.toLowerCase() || null,
        password: hash,
        store: storeDoc._id,
        isActive: true,
        createdByMarketerUid: marketerId,
        source: "marketerQuickOnboard",
      });
      await vendorDoc.save({ session });

      // يمكنك هنا ربط أي سجل محاسبي ensureGLForStore(...) داخل نفس الـ try/catch
      // لا تُرجع كلمة المرور أبداً في الاستجابة
      res.status(201).json({
        storeId: storeDoc._id,
        vendorId: vendorDoc._id,
        activation: { store: false, vendor: false },
        status: "pending_activation",
      });
    }); // end transaction
  } catch (err: any) {
    // تعامل مع خطأ duplicate key (11000)
    if (err?.code === 11000) {
      const key = Object.keys(err.keyValue || {}).join(", ");
      res.status(409).json({ message: `مكرر: ${key} موجود مسبقًا` });
      return;
    }
    console.error("quickOnboard error:", err);
    res.status(500).json({ message: err.message || "Server error" });
    return;
  } finally {
    session.endSession();
  }
};
