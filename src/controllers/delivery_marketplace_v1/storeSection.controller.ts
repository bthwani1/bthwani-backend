// controllers/storeSection.controller.ts
import { Request, Response } from "express";
import StoreSection from "../../models/delivery_marketplace_v1/StoreSection";

export const getStoreSections = async (req: Request, res: Response) => {
  try {
    const { store } = req.query;
    if (!store) {
      res.status(400).json({ message: "store id مطلوب" });
      return;
    }
    const sections = await StoreSection.find({ store }).lean();
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: "خطأ", error: err });
  }
};

// إضافة أقسام أخرى إذا تحتاج (إضافة/تعديل/حذف...)
