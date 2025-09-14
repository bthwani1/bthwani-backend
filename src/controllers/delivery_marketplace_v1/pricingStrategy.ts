import { Request, Response } from "express";
import PricingStrategy from "../../models/delivery_marketplace_v1/PricingStrategy";

// جلب كل الاستراتيجيات
export const listStrategies = async (req: Request, res: Response) => {
  const strategies = await PricingStrategy.find().sort("createdAt");
  res.json(strategies);
};

// إنشاء استراتيجية جديدة
export const createStrategy = async (req: Request, res: Response) => {
  const existing = await PricingStrategy.countDocuments();
  if (existing > 0) {
    res.status(400).json({ message: "Already exists. Use update instead." });
    return;
  }
  const { name, baseDistance, basePrice, pricePerKm, tiers } = req.body;
  const strategy = new PricingStrategy({
    name,
    baseDistance,
    basePrice,
    pricePerKm,
    tiers,
  });
  await strategy.save();
  res.status(201).json(strategy);
};

// تحديث استراتيجية
export const updateStrategy = async (req: Request, res: Response) => {
  const updates = req.body;
  // نستخدم upsert لتنشئ الوثيقة إذا لم تكن موجودة
  const strat = await PricingStrategy.findOneAndUpdate({}, updates, {
    new: true,
    upsert: true,
  });
  res.json(strat);
};

// حذف استراتيجية
export const deleteStrategy = async (req: Request, res: Response) => {
  const strategy = await PricingStrategy.findByIdAndDelete(req.params.id);
  if (!strategy) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.status(204).end();
};
