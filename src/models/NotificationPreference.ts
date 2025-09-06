// models/NotificationPreference.ts
import { Schema, model } from "mongoose";
const NotificationPreferenceSchema = new Schema({
    userId: { type: String, index: true, unique: true },
    // مفاتيح على مستوى الفئات
    orderUpdates: { type: Boolean, default: true },
    promos: { type: Boolean, default: true },
    opsAlerts: { type: Boolean, default: true },
    quietHours: { start: String, end: String }, // "22:00" - "08:00"
  }, { timestamps: true });
export default model("NotificationPreference", NotificationPreferenceSchema);       