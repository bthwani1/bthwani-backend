// models/TopupLog.ts
import mongoose from "mongoose";

const topupLogSchema = new mongoose.Schema({
  type: { type: String, enum: ["topup", "bill"], required: true }, // 👈 جديد
  product: String,
  recipient: String,
  externalId: String,
  status: String,
  response: Object,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export const TopupLog = mongoose.model("TopupLog", topupLogSchema);
topupLogSchema.index({ userId: 1, createdAt: -1 });
