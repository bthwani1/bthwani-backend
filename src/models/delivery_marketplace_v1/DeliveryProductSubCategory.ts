// models/delivry_Marketplace_V1/DeliveryProductSubCategory.ts

import mongoose, { Document, Schema } from "mongoose";

export interface IDeliveryProductSubCategory extends Document {
  storeId: mongoose.Types.ObjectId;  // ← غيّر هنا
  name: string;
}

const subCategorySchema = new Schema<IDeliveryProductSubCategory>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryStore",
      required: true,
    },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDeliveryProductSubCategory>(
  "DeliveryProductSubCategory",
  subCategorySchema
);
