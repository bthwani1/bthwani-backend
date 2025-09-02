// server/src/models/performanceReview.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IPerformanceReview extends Document {
  employee: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  scores: Array<{ kpi: Types.ObjectId; achieved: number; score: number }>;
  overallScore: number;
}

const PerformanceReviewSchema = new Schema<IPerformanceReview>({
  employee:    { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  periodStart: { type: Date, required: true },
  periodEnd:   { type: Date, required: true },
  scores: [{
    kpi:      { type: Schema.Types.ObjectId, ref: 'KpiAssignment' },
    achieved: Number,
    score:    Number,
  }],
  overallScore: Number,
}, { timestamps: true });

export const PerformanceReview = model<IPerformanceReview>('PerformanceReview', PerformanceReviewSchema);