// models/vendor_app/Vendor.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IVendor extends Document {
  fullName: string;
  phone: string;
  password: string;
  store: mongoose.Types.ObjectId;
  isActive: boolean;
  email?: string;
  createdByMarketerUid: string;
  source: string;
  salesCount: number;
  totalRevenue: number;
  expoPushToken: string;
  createdAt: Date;

  // 👇 أضف هذا
  notificationSettings?: {
    enabled: boolean;
    orderAlerts: boolean;
    financialAlerts: boolean;
    marketingAlerts: boolean;
    systemUpdates: boolean;
  };

  // (اختياري) فلاغ لطلب الحذف
  pendingDeletion?: {
    requestedAt: Date;
    reason?: string | null;
    exportData?: boolean;
  };
}

const VendorSchema = new Schema<IVendor>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    password: { type: String, required: true },

    store: { type: Schema.Types.ObjectId, ref: "DeliveryStore", required: true },
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

    // 👇 أضف الحقل للمخطط
    notificationSettings: {
      enabled: { type: Boolean, default: true },
      orderAlerts: { type: Boolean, default: true },
      financialAlerts: { type: Boolean, default: true },
      marketingAlerts: { type: Boolean, default: false },
      systemUpdates: { type: Boolean, default: true },
    },

    // (اختياري) علامة طلب حذف
    pendingDeletion: {
      requestedAt: Date,
      reason: String,
      exportData: Boolean,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IVendor>("Vendor", VendorSchema);
VendorSchema.index({ store: 1 });
VendorSchema.index({ createdByMarketerUid: 1, createdAt: -1 });