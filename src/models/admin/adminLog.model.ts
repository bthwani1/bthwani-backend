import mongoose, { Schema, Document } from "mongoose";

export interface AdminLogDocument extends Document {
  actorId?: mongoose.Types.ObjectId; // المدير أو النظام
  action: string;
  details?: string;
  createdAt: Date;
}

const AdminLogSchema = new Schema<AdminLogDocument>({
  actorId: { type: Schema.Types.ObjectId, ref: "Admin" },
  action: { type: String, required: true },
  details: String,
  createdAt: { type: Date, default: Date.now }
});

export const AdminLog = mongoose.model("AdminLog", AdminLogSchema);
