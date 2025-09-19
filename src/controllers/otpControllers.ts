import { Types } from "mongoose";
import { OTP } from "../models/otp";
import { User } from "../models/user";
import { generateOTP } from "../utils/otpAll";
import { sendOtpEmail } from "../utils/sendEmail"; // استخدم ما جهزناه سابقًا

export const sendEmailOTP = async (
  email: string,
  userId: string,
  purpose: string
): Promise<string> => {
  const code = await generateOTP({ userId, purpose, metadata: { email } });

  // في التطوير: لا تعتمد على SMTP
  const channel = "smtp"; // default: smtp
  if (channel !== "smtp") {
    return code; // console/mock
  }

  await sendOtpEmail(email, code);
  return code;
};

// controllers/otpControllers.ts (تحسين verifyOTP)
export const verifyOTP = async ({
  userId,
  email,
  purpose,
  code,
}: {
  userId?: string;
  email?: string;
  purpose?: string;
  code: string;
}) => {
  const q: any = { code, used: false, expiresAt: { $gt: new Date() } };
  if (userId) q.userId = new Types.ObjectId(userId);
  else if (email) q["metadata.email"] = (email || "").trim().toLowerCase();
  if (purpose) q.purpose = purpose; // اختياري بدل ما يكون إجباري

  const otp = await OTP.findOne(q);
  if (!otp) return { valid: false };

  await User.updateOne({ _id: otp.userId }, { $set: { emailVerified: true } });
  otp.used = true;
  await otp.save();
  return { valid: true };
};
