import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema({
  userId: mongoose.Types.ObjectId,
  purpose: String,
  code: String,
  expiresAt: Date,
  used: { type: Boolean, default: false },
  metadata: mongoose.Schema.Types.Mixed,
});
export const OTP = mongoose.model("OTP", OTPSchema);
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// مرة واحدة في تعريف الموديل
OTPSchema.index(
  { userId: 1, purpose: 1, used: 1 },
  { unique: true, partialFilterExpression: { used: false } }
);
