import mongoose, { Document, Schema } from "mongoose";

export interface IDeliveryBanner extends Document {
  title?: string;
  description?: string;
  image: string;
  link?: string;
  store?: mongoose.Types.ObjectId;
  category?: mongoose.Types.ObjectId;
  isActive: boolean;
  order: number;
  startDate?: Date;
  endDate?: Date;
}

const bannerSchema = new Schema<IDeliveryBanner>({
  title:       { type: String },
  description: { type: String },
  image:       { type: String, required: true },
  link:        { type: String },
  store:       { type: Schema.Types.ObjectId, ref: "DeliveryStore" },
  category:    { type: Schema.Types.ObjectId, ref: "DeliveryCategory" },
  isActive:    { type: Boolean, default: true },
  order:       { type: Number, default: 0 },
  startDate:   { type: Date },
  endDate:     { type: Date },
}, { timestamps: true });

export default mongoose.model<IDeliveryBanner>(
  "DeliveryBanner",
  bannerSchema
);
