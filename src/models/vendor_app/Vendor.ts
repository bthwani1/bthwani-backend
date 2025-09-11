import mongoose, { Document, Schema } from "mongoose";

export interface IVendor extends Document {
  fullName: string;
  phone: string;
  password: string;

  store: mongoose.Types.ObjectId; // المتجر الذي يديره
  isActive: boolean; // مفعل/موقوف
  email?: string;
  createdByMarketerUid: string;
  source: string;
  // إحصائيات مبسطة للتاجر
  salesCount: number; // عدد المبيعات
  totalRevenue: number; // إجمالي الإيرادات
  expoPushToken: string;
  createdAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    password: { type: String, required: true },

    store: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryStore",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    createdByMarketerUid: { type: String, index: true },
    source: {
      type: String,
      enum: ["marketerQuickOnboard", "admin", "other"],
      default: "marketerQuickOnboard",
    },

    salesCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    expoPushToken: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IVendor>("Vendor", VendorSchema);
