// models/Message.ts
import { Schema, model, Types } from "mongoose";

const MessageSupportSchema = new Schema(
  {
    ticketId: { type: Types.ObjectId, ref: "SupportTicket", index: true, required: true },
    sender: { type: String, enum: ["user", "agent"], required: true },
    text: { type: String, trim: true, maxlength: 4000 },
    attachments: [{ url: String, name: String, size: Number, mime: String }],
    createdAt: { type: Date, default: Date.now, index: true },
    readAt: Date,
  },
  { versionKey: false }
);

export default model("MessageSupport", MessageSupportSchema);
