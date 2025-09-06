import { Schema, model } from "mongoose";

// models/Notification.ts
const NotificationSchema = new Schema({
    toUser: { type: String, index: true },
    audience: { type: [String], default: [] }, // ["user","driver","vendor"]
    collapseId: { type: String, index: true }, // order:123:status
    title: String,
    body: String,
    data: Schema.Types.Mixed,
    status: { type: String, enum: ["queued","sent","delivered","failed"], default: "queued" },
    tickets: [Schema.Types.Mixed],   // رد Expo عند الإرسال
    receipts: [Schema.Types.Mixed],  // رد Expo عند التحقق
    error: String,
  }, { timestamps: true });
  export default model("Notification", NotificationSchema);
