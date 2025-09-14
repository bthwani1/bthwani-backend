import mongoose, { Document, Schema } from "mongoose";

export interface IDeliveryOffer extends Document {
  title: string;
  target: 'product' | 'store' | 'category';
  value: number;
  valueType: 'percentage' | 'fixed';
  product?: mongoose.Types.ObjectId;
  store?: mongoose.Types.ObjectId;
  category?: mongoose.Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
}

const offerSchema = new Schema<IDeliveryOffer>({
  title:      { type: String, required: true },
  target:     { type: String, enum: ['product','store','category'], required: true },
  value:      { type: Number, required: true },
  valueType:  { type: String, enum: ['percentage','fixed'], required: true },
  product:    { type: Schema.Types.ObjectId, ref: "DeliveryProduct" },
  store:      { type: Schema.Types.ObjectId, ref: "DeliveryStore" },
  category:   { type: Schema.Types.ObjectId, ref: "DeliveryCategory" },
  startDate:  Date,
  endDate:    Date,
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IDeliveryOffer>(
  "DeliveryOffer",
  offerSchema
);
