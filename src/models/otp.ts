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
