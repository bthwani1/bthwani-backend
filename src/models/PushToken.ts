// models/PushToken.ts
import { Schema, model } from "mongoose";

const PushTokenSchema = new Schema({
  userId: { type: String, index: true, required: true },
  token: { type: String, unique: true, index: true, required: true }, // ExpoPushToken[...]
  platform: { type: String, enum: ["ios","android","web"], index: true }, // اختياري
  app: { type: String, enum: ["user","driver","vendor"], index: true },    // عندك 3 تطبيقات
  device: { type: String },          // موديل الجهاز/OS
  locale: { type: String, default: "ar" },
  timezone: { type: String, default: "Asia/Aden" },
  lastSeenAt: { type: Date, default: Date.now },
  disabled: { type: Boolean, default: false },      // للإيقاف المؤقت
  failureCount: { type: Number, default: 0 },       // لسياسة التنظيف
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default model("PushToken", PushTokenSchema);
