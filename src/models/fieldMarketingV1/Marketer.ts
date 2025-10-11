// src/models/marketing/Marketer.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMarketer extends Document {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  team?: string;
  area?: string;
  status: "active" | "suspended";
  password: string; // bcrypt hash
  expoPushToken?: string;
  deletedAt?: Date;
  deletionRequestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MarketerSchema = new Schema<IMarketer>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true },
    city: { type: String },
    team: { type: String },
    area: { type: String },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    password: { type: String, required: true },
    expoPushToken: { type: String },
    deletedAt: { type: Date },
    deletionRequestedAt: { type: Date },
  },
  { timestamps: true }
);
export default mongoose.model<IMarketer>("Marketer", MarketerSchema);
