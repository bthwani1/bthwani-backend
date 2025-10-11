// utils/otpAll.ts
import { Types } from "mongoose";
import { OTP } from "../models/otp";

// دوال إرسال OTP عبر قنوات مختلفة
export async function sendOTPByChannel(
  channel: "email" | "whatsapp" | "sms",
  recipient: string,
  code: string,
  purpose?: string
): Promise<void> {
  switch (channel) {
    case "email":
      const { sendOtpEmail } = await import("./sendEmail");
      await sendOtpEmail(recipient, code);
      break;
    case "whatsapp":
      await sendWhatsAppOTP(recipient, code, purpose);
      break;
    case "sms":
      await sendSMSOTP(recipient, code, purpose);
      break;
    default:
      throw new Error(`قناة غير مدعومة: ${channel}`);
  }
}

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

// إرسال OTP عبر WhatsApp باستخدام Meta Cloud API
async function sendWhatsAppOTP(phone: string, code: string, purpose?: string): Promise<void> {
  try {
    // تنظيف رقم الهاتف
    const cleanPhone = phone.replace(/[^\d]/g, '');

    // إضافة رمز البلد إذا لم يكن موجودًا
    const formattedPhone = cleanPhone.startsWith('966') ? cleanPhone : `966${cleanPhone}`;

    // رسالة القالب لـ OTP
    const message = `رمز التحقق الخاص بك هو: ${code}\n\nهذا الرمز صالح لمدة 10 دقائق فقط.`;

    // في البيئة الحقيقية، استخدم Meta Cloud API
    console.log(`📱 WhatsApp OTP: ${code} sent to ${formattedPhone}`);
    console.log(`Message: ${message}`);

    // مثال لاستخدام Meta Cloud API (يجب استبداله بإعداداتك الحقيقية):
    /*
    const response = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: { body: message }
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status}`);
    }
    */

  } catch (error) {
    console.error('❌ WhatsApp OTP send failed:', error);
    throw error;
  }
}

// إرسال OTP عبر SMS باستخدام مزود SMS
async function sendSMSOTP(phone: string, code: string, purpose?: string): Promise<void> {
  try {
    // تنظيف رقم الهاتف
    const cleanPhone = phone.replace(/[^\d]/g, '');

    // إضافة رمز البلد إذا لم يكن موجودًا
    const formattedPhone = cleanPhone.startsWith('966') ? cleanPhone : `966${cleanPhone}`;

    // رسالة SMS قصيرة
    const message = `رمز التحقق: ${code} - صالح لمدة 10 دقائق`;

    // في البيئة الحقيقية، استخدم مزود SMS مثل Twilio أو مزود محلي
    console.log(`📱 SMS OTP: ${code} sent to ${formattedPhone}`);
    console.log(`Message: ${message}`);

    // مثال لاستخدام Twilio (يجب استبداله بإعداداتك الحقيقية):
    /*
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+${formattedPhone}`
    });
    */

  } catch (error) {
    console.error('❌ SMS OTP send failed:', error);
    throw error;
  }
}
