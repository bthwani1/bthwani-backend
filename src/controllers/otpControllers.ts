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
  purpose: string;
  code: string;
}) => {
  const query: any = {
    purpose,
    code,
    used: false,
    expiresAt: { $gt: new Date() },
  };
  if (userId) query.userId = new Types.ObjectId(userId);
  else if (email) query["metadata.email"] = (email || "").trim().toLowerCase();

  const otp = await OTP.findOne(query);
  if (!otp) return { valid: false };

  // ✅ حدّث بالمؤكد (userId) ثم إحتماليًا بالإيميل إن وُجد
  await User.updateOne({ _id: otp.userId }, { $set: { emailVerified: true } });
  if (otp.metadata?.email) {
    await User.updateOne(
      { email: otp.metadata.email },
      { $set: { emailVerified: true } }
    );
  }

  otp.used = true;

  await otp.save();

  return { valid: true };
};
