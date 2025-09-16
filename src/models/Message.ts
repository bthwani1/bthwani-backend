// src/models/Message.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  channel: "push" | "sms" | "inapp";
  title?: string;
  body: string;
  segmentId?: mongoose.Types.ObjectId;
  userIds: string[];
  scheduleAt?: Date;
  status: "scheduled" | "sending" | "sent" | "failed";
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    channel: {
      type: String,
      enum: ["push", "sms", "inapp"],
      required: true,
    },
    title: {
      type: String,
      required: false,
    },
    body: {
      type: String,
      required: true,
    },
    segmentId: {
      type: Schema.Types.ObjectId,
      ref: "Segment",
      required: false,
    },
    userIds: [
      {
        type: String,
        required: true,
      },
    ],
    scheduleAt: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ["scheduled", "sending", "sent", "failed"],
      default: "scheduled",
    },
    createdBy: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMessage>("Message", MessageSchema);
