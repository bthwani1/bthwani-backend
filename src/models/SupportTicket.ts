// models/SupportTicket.ts
import { Schema, model } from "mongoose";

const Msg = new Schema(
  {
    sender: { type: String, enum: ["user", "agent"], required: true },
    text: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

export default model(
  "SupportTicket",
  new Schema(
    {
      userId: { type: String, index: true }, // <-- كان ObjectId: غيّرناه إلى String
      subject: String,
      status: { type: String, enum: ["open", "closed"], default: "open" },
      messages: [Msg],
    },
    { timestamps: true }
  )
);
