import { Schema, model, Types, Document } from "mongoose";

export type OnbStatus =
  | "draft"
  | "submitted"
  | "needs_fix"
  | "approved"
  | "rejected";

export interface IOnboarding extends Document {
  storeDraft: {
    name: string;
    address: string;
    category: Types.ObjectId;
    location: { lat: number; lng: number };
    image?: string;
    logo?: string;
    tags?: string[];
    usageType?: string;
  };
  ownerDraft?: { fullName?: string; phone?: string; email?: string };
  attachments?: { url: string; kind?: string; note?: string }[];
  participants: { marketerId: string; role?: "lead" | "support"; weight?: number }[];
  status: OnbStatus;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  notes?: string; // للـ needs_fix أو الرفض
  createdByMarketerId: string; // منشئ الطلب (المسوّق)
  createdAt: Date;
  updatedAt: Date;
}

const Sch = new Schema<IOnboarding>(
  {
    storeDraft: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      category: {
        type: Schema.Types.ObjectId,
        ref: "DeliveryCategory",
        required: true,
      },
      location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      image: String,
      logo: String,
      tags: [String],
      usageType: String,
    },
    ownerDraft: {
      fullName: String,
      phone: String,
      email: String,
    },
    attachments: [{ url: String, kind: String, note: String }],
  // Onboarding Schema
participants: [
  {
    marketerId: { type: String, required: true }, // بدل uid
    role: { type: String, enum: ["lead", "support"] },
    weight: { type: Number, min: 0, max: 1 },
  },
],

    status: {
      type: String,
      enum: ["draft", "submitted", "needs_fix", "approved", "rejected"],
      default: "submitted",
      index: true,
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: String,
    createdByMarketerId: { type: String, required: true, index: true }, // بدل createdByUid
  },
  { timestamps: true }
);

export default model<IOnboarding>("Onboarding", Sch);
Sch.index({ "participants.marketerId": 1, createdAt: -1 });
Sch.index({ status: 1, createdAt: -1 });
Sch.index({ createdAt: -1 });
