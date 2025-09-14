import mongoose, { Schema, Document, Model } from "mongoose";

interface WithdrawalRequestType extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  status: "pending" | "approved" | "rejected";
  fee: number;
  requestedAt: Date;
  processedAt?: Date;
  adminNote?: string;
  method: "agent" | "bank" | "other";
  accountInfo: string;
}

const WithdrawalRequestSchema = new Schema<WithdrawalRequestType>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  fee: { type: Number, default: 0 },
  requestedAt: { type: Date, default: Date.now },
  processedAt: Date,
  adminNote: String,
  method: { type: String, enum: ["agent", "bank", "other"], default: "agent" },
  accountInfo: String,
});

export const WithdrawalRequest: Model<WithdrawalRequestType> = mongoose.model(
  "WithdrawalRequest",
  WithdrawalRequestSchema
);
WithdrawalRequestSchema.index({ userId: 1, requestedAt: -1 });
