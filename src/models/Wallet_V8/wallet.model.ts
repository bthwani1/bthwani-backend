import mongoose from "mongoose";

const WalletTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userModel: { type: String, required: true, enum: ["User", "Driver"] },

  amount: { type: Number, required: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  method: {
    type: String,
    enum: [
      "agent",
      "card",
      "transfer",
      "payment",
      "escrow",
      "reward",
      "kuraimi",
      "withdrawal",
    ], // + withdrawal
    default: "kuraimi",
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "reversed"],
    default: "completed",
  }, // وسّعناها

  description: String,
  bankRef: String,
  meta: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

export const WalletTransaction = mongoose.model(
  "WalletTransaction",
  WalletTransactionSchema
);
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ bankRef: 1 }, { unique: true, sparse: true });

// لمنع حجزَين لنفس الطلب لنفس المستخدم
WalletTransactionSchema.index(
  { userId: 1, "meta.orderId": 1, method: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { method: "escrow", status: "pending" },
  }
);
