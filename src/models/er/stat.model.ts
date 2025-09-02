import { Schema, model, Document } from 'mongoose';

export interface IStat extends Document {
  key: string;       // e.g. 'totalRevenue', 'completedTasks', 'employeePerformance'
  value: number;
  date: Date;        // فترة الإحصاء
}

const StatSchema = new Schema<IStat>({
  key:   { type: String, required: true, index: true },
  value: { type: Number, required: true },
  date:  { type: Date,   required: true, default: () => new Date() },
}, { timestamps: true });

export const Stat = model<IStat>('Stat', StatSchema);