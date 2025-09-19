// models/SupportTicket.ts
import { Schema, model } from "mongoose";

const SupportTicket = new Schema(
  {
    userId: { type: String, index: true, required: true },
    subject: { type: String, trim: true, maxlength: 200 },
    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
    lastMessageAt: { type: Date, default: Date.now, index: true }, // لفرز التذاكر
  },
  { timestamps: true }
);

SupportTicket.index({ userId: 1, lastMessageAt: -1 });
export default model("SupportTicket", SupportTicket);
