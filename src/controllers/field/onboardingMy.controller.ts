// src/controllers/field/onboardingMy.controller.ts
import { Request, Response } from "express";
import DeliveryStore from "../../models/delivery_marketplace_v1/DeliveryStore";
import Vendor from "../../models/vendor_app/Vendor";

export const getMyOnboarding = async (req: Request, res: Response) => {
  try {
    const uid = (req.user as any)?.uid;
    if (!uid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // المتاجر التي أنشأها هذا المسوّق
    const stores = await DeliveryStore.find({ createdByMarketerUid: uid })
      .select("_id name address isActive image logo createdAt")
      .lean();

    // التُجّار المرتبطين بهذه المتاجر
    const storeIds = stores.map((s) => s._id);
    const vendors = await Vendor.find({ store: { $in: storeIds } })
      .select("_id fullName phone email isActive store")
      .lean();

    // خريطة المتجر -> التاجر
    const byStore: Record<string, any[]> = {};
    for (const v of vendors) {
      const k = String(v.store);
      byStore[k] = byStore[k] || [];
      byStore[k].push(v);
    }

    const items = stores.map((s) => ({
      store: s,
      vendors: byStore[String(s._id)] || [],
      activation: {
        store: !!s.isActive,
        vendor: (byStore[String(s._id)] || []).some((v) => v.isActive),
      },
    }));

    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
