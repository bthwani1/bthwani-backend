// models/NotificationCampaign.ts
import { Schema, model } from "mongoose";

const CampaignSchema = new Schema({
  title: { type: String, required: true },              // اسم داخلي للحملة
  message: {
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    channelId: { type: String, default: "orders" },     // لقناة أندرويد
    collapseId: { type: String },                       // لتجميع التنبيهات
  },
  audience: {
    apps: [{ type: String, enum: ["user","driver","vendor"], default: "user" }],
    platforms: [{ type: String, enum: ["android","ios","web"] }],
    cities: [{ type: String }],
    minOrders: { type: Number },                        // >= كم طلب
    lastActiveDays: { type: Number },                   // نشِط خلال X يوم
    optedInPromosOnly: { type: Boolean, default: false }
  },
  schedule: {
    type: { type: String, enum: ["now","cron","datetime"], default: "now" },
    when: { type: Date },                               // عند datetime
    cron: { type: String }                              // "0 10 * * *" مثلاً
  },
  status: { type: String, enum: ["draft","scheduled","running","completed","cancelled","failed"], default: "draft" },
  stats: {
    queued: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 }
  },
  createdBy: { type: String, required: true },          // admin uid
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

CampaignSchema.index({ "status": 1, "schedule.when": 1 });
export default model("NotificationCampaign", CampaignSchema);
