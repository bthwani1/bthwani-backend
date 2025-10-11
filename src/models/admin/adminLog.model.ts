import mongoose, { Schema, Document } from "mongoose";

export interface AdminLogDocument extends Document {
  actorId?: mongoose.Types.ObjectId; // المدير أو النظام
  actorType: "admin" | "vendor" | "user" | "system";
  action: string;
  method: string;
  route: string;
  status: "success" | "error";
  ip?: string;
  userAgent?: string;
  details?: string;
  changes?: any; // diff مختصر
  durationMs?: number;
  createdAt: Date;
}

const AdminLogSchema = new Schema<AdminLogDocument>({
  actorId: { type: Schema.Types.ObjectId, ref: "Admin" },
  actorType: {
    type: String,
    enum: ["admin", "vendor", "user", "system"],
    required: true,
    default: "system"
  },
  action: { type: String, required: true },
  method: { type: String, required: true },
  route: { type: String, required: true },
  status: {
    type: String,
    enum: ["success", "error"],
    required: true,
    default: "success"
  },
  ip: String,
  userAgent: String,
  details: String,
  changes: Schema.Types.Mixed,
  durationMs: Number,
  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance
AdminLogSchema.index({ createdAt: -1 });
AdminLogSchema.index({ actorId: 1, createdAt: -1 });
AdminLogSchema.index({ action: 1, createdAt: -1 });
AdminLogSchema.index({ actorType: 1, createdAt: -1 });

// Optional: TTL index for retention (180-365 days)
// Uncomment if compliance requirements allow automatic deletion
// AdminLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60*60*24*365 });

export const AdminLog = mongoose.model("AdminLog", AdminLogSchema);
