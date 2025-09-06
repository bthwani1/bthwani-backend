// models/NotificationTemplate.ts
import { Schema, model } from "mongoose";
const TemplateSchema = new Schema(
  {
    name: { type: String, unique: true, required: true },
    message: {
      title: String,
      body: String,
      data: Schema.Types.Mixed,
      channelId: { type: String, default: "orders" },
      collapseId: String,
    },
    createdBy: String,
  },
  { timestamps: true }
);
export default model("NotificationTemplate", TemplateSchema);
