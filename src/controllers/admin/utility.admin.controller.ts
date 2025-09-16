import { Request, Response } from "express";
import UtilityPricing from "../../models/delivery_marketplace_v1/UtilityPricing";

export const upsertGasOptions = async (req: Request, res: Response) => {
  try {
    const {
      city,
      cylinderSizeLiters,
      pricePerCylinder,
      minQty,
      deliveryPolicy, // "flat" | "strategy"
      flatFee, // number | null
    } = req.body as {
      city: string;
      cylinderSizeLiters: number;
      pricePerCylinder: number;
      minQty?: number;
      deliveryPolicy: "flat" | "strategy";
      flatFee: number | null;
    };

    if (!city) {
      res.status(400).json({ message: "city مطلوب" });
      return;
    }

    const doc = await UtilityPricing.findOneAndUpdate(
      { city },
      {
        $set: {
          isActive: true,
          "gas.enabled": true,
          "gas.cylinderSizeLiters": Number(cylinderSizeLiters ?? 20),
          "gas.pricePerCylinder": Number(pricePerCylinder ?? 0),
          "gas.minQty": Number(minQty ?? 1),
          "gas.deliveryOverride.policy": deliveryPolicy,
          "gas.deliveryOverride.flatFee":
            flatFee === null ? undefined : Number(flatFee),
        },
      },
      { new: true, upsert: true }
    ).lean();

    // أعِد فورمات واجهة الأدمن
    res.json({
      city,
      gas: {
        city,
        cylinderSizeLiters: doc?.gas?.cylinderSizeLiters ?? 20,
        pricePerCylinder: doc?.gas?.pricePerCylinder ?? 0,
        minQty: doc?.gas?.minQty ?? 1,
        deliveryPolicy: doc?.gas?.deliveryOverride?.policy ?? "strategy",
        flatFee: doc?.gas?.deliveryOverride?.flatFee ?? null,
      },
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "فشل الحفظ" });
  }
};

export const upsertWaterOptions = async (req: Request, res: Response) => {
  try {
    const {
      city,
      sizes,
      allowHalf,
      halfPolicy, // "linear" | "multiplier" | "fixed"
      deliveryPolicy, // "flat" | "strategy"
      flatFee, // number | null
    } = req.body as any;

    if (!city) {
      res.status(400).json({ message: "city مطلوب" });
      return;
    }

    // حافظ على القيم الافتراضية للنصف إذا السياسة تحتاجها
    // (لو ما أرسلت قيم) — تُستخدم القيم الموجودة أو الافتراضية
    const existing = await UtilityPricing.findOne({ city }).lean();

    const nextHalfLinear = existing?.water?.halfLinearFactor ?? 0.5;
    const nextHalfMult = existing?.water?.halfMultiplier ?? 0.6;
    const nextHalfFixed = existing?.water?.halfFixedAmount ?? 0;

    const doc = await UtilityPricing.findOneAndUpdate(
      { city },
      {
        $set: {
          isActive: true,
          "water.enabled": true,
          "water.sizes": Array.isArray(sizes) ? sizes : [],
          "water.allowHalf": !!allowHalf,
          "water.halfPricingPolicy": halfPolicy,
          "water.halfLinearFactor": nextHalfLinear,
          "water.halfMultiplier": nextHalfMult,
          "water.halfFixedAmount": nextHalfFixed,
          "water.deliveryOverride.policy": deliveryPolicy,
          "water.deliveryOverride.flatFee":
            flatFee === null ? undefined : Number(flatFee),
        },
      },
      { new: true, upsert: true }
    ).lean();

    res.json({
      city,
      water: {
        city,
        sizes: doc?.water?.sizes ?? [],
        allowHalf: doc?.water?.allowHalf ?? true,
        halfPolicy: doc?.water?.halfPricingPolicy ?? "multiplier",
        deliveryPolicy: doc?.water?.deliveryOverride?.policy ?? "strategy",
        flatFee: doc?.water?.deliveryOverride?.flatFee ?? null,
      },
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "فشل الحفظ" });
  }
};
