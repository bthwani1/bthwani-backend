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
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 دقائق

  await OTP.deleteMany({ userId, purpose, used: false }); // 
console.log("🚀 جاري إنشاء OTP:", {
  userId,
  purpose,
  code,
  metadata,
});

await OTP.create({
    userId,
    purpose,
    code,
    expiresAt,
    metadata,
  });
const newOtp = await OTP.create({ userId, purpose, code, expiresAt, metadata });
console.log("✅ OTP تم حفظه:", newOtp);

  return code;
};
