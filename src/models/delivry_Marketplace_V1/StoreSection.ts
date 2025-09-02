// models/StoreSection.ts
import mongoose, { Document, Schema } from "mongoose";
export interface IStoreSection extends Document {
  store: mongoose.Types.ObjectId; // صاحب القسم
  name: string;                   // اسم القسم (مشاوي، خضروات، عصائر...)
  usageType: 'grocery' | 'restaurant' | 'retail';
}
const storeSectionSchema = new Schema<IStoreSection>({
  store:     { type: Schema.Types.ObjectId, ref: "DeliveryStore", required: true },
  name:      { type: String, required: true },
  usageType: { type: String, enum: ["grocery", "restaurant", "retail"], required: true },
}, { timestamps: true });
export default mongoose.model<IStoreSection>("StoreSection", storeSectionSchema);
