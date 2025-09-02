// models/SheinCart.ts
import mongoose, { Schema, Types } from "mongoose";

export interface SheinItem {
  name: string;
  price: number;
  quantity: number;
  id: string;
  sheinUrl: string;
  image?: string;
  currency?: string;
  attributes?: Map<string, string>;
}

const sheinItem = new Schema(
  {
    id: { type: String, required: true }, // url::variantKey
    name: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String }, // اختياري (SAR/…)
    image: { type: String },
    sheinUrl: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    attributes: { type: Map, of: String }, // Size/Color…
  },
  { _id: false }
);

const sheinCart = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      unique: true,
    },
    items: { type: [sheinItem], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("SheinCart", sheinCart);
