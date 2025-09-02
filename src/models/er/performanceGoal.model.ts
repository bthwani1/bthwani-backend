// server/src/models/performanceGoal.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IPerformanceGoal extends Document {
  employee: Types.ObjectId;
  title: string;
  description: string;
  targetDate: Date;
  status: 'open' | 'in-progress' | 'completed';
}

const PerformanceGoalSchema = new Schema<IPerformanceGoal>({
  employee:   { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  title:      { type: String, required: true },
  description:{ type: String },
  targetDate: { type: Date, required: true },
  status:     { type: String, enum: ['open','in-progress','completed'], default: 'open' },
}, { timestamps: true });

export const PerformanceGoal = model<IPerformanceGoal>('PerformanceGoal', PerformanceGoalSchema);