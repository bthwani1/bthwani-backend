import mongoose, { Schema, Document } from "mongoose";

export type UtilityKind = "gas" | "water";

export interface IDailyPrice extends Document {
  kind: UtilityKind; // gas | water
  city: string; // المدينة
  date: string; // "YYYY-MM-DD"
  variant?: string | null; // gas: "20L" | water: "small|medium|large"
  price: number; // override للسعر
}

const dailyPriceSchema = new Schema<IDailyPrice>(
  {
    kind: { type: String, enum: ["gas", "water"], required: true },
    city: { type: String, required: true },
    date: { type: String, required: true }, // نخزنها كسلسلة لتفادي تعقيدات المناطق الزمنية
    variant: { type: String, default: null },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

// مفتاح فريد (kind, city, date, variant)
dailyPriceSchema.index(
  { kind: 1, city: 1, date: 1, variant: 1 },
  { unique: true, name: "uniq_daily_price" }
);

export default mongoose.model<IDailyPrice>("DailyPrice", dailyPriceSchema);
