// utils/otpAll.ts
import { Types } from "mongoose";
import { OTP } from "../models/otp";

export const generateOTP = async ({
  userId,
  purpose,
  metadata,
}: {
  userId?: string;
  purpose: string;
  metadata?: any;
}) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const _uid = userId ? new Types.ObjectId(userId) : undefined;

  await OTP.deleteMany({
    ...(userId && { userId: _uid }),
    purpose,
    used: false,
  });

  const newOtp = await OTP.create({
    ...(userId && { userId: _uid }),
    purpose,
    code,
    expiresAt,
    metadata,
  });

  console.log("✅ OTP saved:", {
    _id: newOtp._id,
    userId: newOtp.userId,
    purpose,
    code,
    expiresAt,
  });

  return code;
};
