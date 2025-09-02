// server/src/models/leaveRequest.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface ILeaveRequest extends Document {
  employee: Types.ObjectId;
  type: 'annual' | 'sick' | 'unpaid';
  from: Date;
  to: Date;
  status: 'pending' | 'approved' | 'rejected';
  approver?: Types.ObjectId;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  type:     { type: String, enum: ['annual','sick','unpaid'], required: true },
  from:     { type: Date, required: true },
  to:       { type: Date, required: true },
  status:   { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  approver: { type: Schema.Types.ObjectId, ref: 'Employee' },
}, { timestamps: true });

export const LeaveRequest = model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);