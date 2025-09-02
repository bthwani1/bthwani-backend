// server/src/models/kpiAssignment.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IKpiAssignment extends Document {
  employee: Types.ObjectId;
  title: string;
  targetValue: number;
  weight: number;
}

const KpiAssignmentSchema = new Schema<IKpiAssignment>({
  employee:    { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  title:       { type: String, required: true },
  targetValue: { type: Number, required: true },
  weight:      { type: Number, default: 1 },
}, { timestamps: true });

export const KpiAssignment = model<IKpiAssignment>('KpiAssignment', KpiAssignmentSchema);