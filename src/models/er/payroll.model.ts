// server/src/models/payroll.model.ts
import { Schema, model, Document, Types } from 'mongoose';
export interface IPayroll extends Document {
  employee: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  status: 'pending' | 'processed';
}
const PayrollSchema = new Schema<IPayroll>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  grossAmount: { type: Number, required: true },
  deductions: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending','processed'], default: 'pending' },
}, { timestamps: true });
export const Payroll = model<IPayroll>('Payroll', PayrollSchema);