import mongoose, { Schema, Document, Model } from "mongoose";

export interface CouponType extends Document {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  expiryDate: Date;
  isUsed: boolean;
  assignedTo?: mongoose.Types.ObjectId;
  usageLimit?: number;
  usedCount: number;
  createdAt: Date;
}

const CouponSchema = new Schema<CouponType>({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ["percentage", "fixed", "free_shipping"], required: true },
  value: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  usageLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const Coupon: Model<CouponType> = mongoose.model("Coupon", CouponSchema);
