// server/src/models/drivers/leaveRequest.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IDriverLeaveRequest extends Document {
  driver: Types.ObjectId;
  fromDate: Date;
  toDate: Date;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const DriverLeaveRequestSchema = new Schema<IDriverLeaveRequest>({
  driver: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
}, { timestamps: true });

// Index for better query performance
DriverLeaveRequestSchema.index({ driver: 1, status: 1 });
DriverLeaveRequestSchema.index({ status: 1, createdAt: -1 });

export const DriverLeaveRequest = model<IDriverLeaveRequest>('DriverLeaveRequest', DriverLeaveRequestSchema);
