// src/models/security/AccountDeletionRequest.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAccountDeletionRequest extends Document {
  marketerId: string; // ObjectId string
  status: "pending" | "received" | "confirmed" | "rejected";
  reason?: string | null;
  contact?: string | null; // بريد/هاتف/نص
  createdAt: Date;
  updatedAt: Date;
}

const Sch = new Schema<IAccountDeletionRequest>(
  {
    marketerId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "received", "confirmed", "rejected"],
      default: "pending",
      index: true,
    },
    reason: { type: String },
    contact: { type: String },
  },
  { timestamps: true }
);

// منع طلبات متداخلة كثيرة لنفس المستخدم
Sch.index({ marketerId: 1, status: 1 });

export default mongoose.model<IAccountDeletionRequest>(
  "AccountDeletionRequest",
  Sch
);
