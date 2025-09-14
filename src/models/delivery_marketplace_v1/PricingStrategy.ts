// src/models/PricingStrategy.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IPricingTier {
  minDistance: number; // بداية الشريحة (كم)
  maxDistance: number; // نهاية الشريحة (كم)
  pricePerKm: number; // ريال لكل كيلومتر ضمن هذه الشريحة
}

export interface IPricingStrategy extends Document {
  name: string;
  baseDistance: number;
  basePrice: number;
  tiers: IPricingTier[]; // الآن نحتفظ بالرينجات فقط
  defaultPricePerKm: number; // ثمن الكيلو إذا تجاوز المسافات المعرفة
  createdAt: Date;
  updatedAt: Date;
}

const pricingTierSchema = new Schema<IPricingTier>(
  {
    minDistance: { type: Number, required: true },
    maxDistance: { type: Number, required: true },
    pricePerKm: { type: Number, required: true },
  },
  { _id: false }
);

const pricingStrategySchema = new Schema<IPricingStrategy>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    baseDistance: { type: Number, required: true, default: 0 }, // المسافة الابتدائية
    basePrice: { type: Number, required: true, default: 0 }, // السعر الابتدائي
    tiers: {
      type: [pricingTierSchema],
      default: [],
    },
    defaultPricePerKm: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPricingStrategy>(
  "PricingStrategy",
  pricingStrategySchema
);
