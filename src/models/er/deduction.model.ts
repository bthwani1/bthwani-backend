// server/src/models/deduction.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IDeduction extends Document {
  employee: Types.ObjectId;
  date: Date;
  amount: number;
  reason: string;
}

const DeductionSchema = new Schema<IDeduction>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  date:     { type: Date, default: () => new Date() },
  amount:   { type: Number, required: true },
  reason:   { type: String, required: true },
}, { timestamps: true });

export const Deduction = model<IDeduction>('Deduction', DeductionSchema);