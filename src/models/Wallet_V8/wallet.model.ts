import mongoose from "mongoose";

const WalletTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userModel: { type: String, required: true, enum: ["User", "Driver"] },

  amount: { type: Number, required: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  method: { type: String, enum: ["agent", "card", "transfer", "payment", "escrow", "reward", "kuraimi"],default:"kuraimi" , required: true },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
  description: String,
  bankRef: String,
  meta: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

export const WalletTransaction = mongoose.model("WalletTransaction", WalletTransactionSchema);