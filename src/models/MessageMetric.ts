// src/models/MessageMetric.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IMessageMetric extends Document {
  messageId: mongoose.Types.ObjectId;
  userId: string;
  channel: "push" | "sms" | "inapp";
  status: "sent" | "delivered" | "opened" | "clicked" | "failed";
  timestamp: Date;
  metadata?: Record<string, any>;
}

const MessageMetricSchema = new Schema<IMessageMetric>(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ["push", "sms", "inapp"],
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "opened", "clicked", "failed"],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMessageMetric>(
  "MessageMetric",
  MessageMetricSchema
);
