// server/src/models/task.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  department: string;            // اسم القسم (HR, Finance, …)
  category: string;              // فئة المهمة (Onboarding, Audit, …)
  assignedTo: Types.ObjectId[];  // معرفات الموظفين المسؤولين
  dueDate?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  incentiveAmount?: number;      // جائزة مرتبطة بالمهمة
  createdBy: Types.ObjectId;     // من أضاف المهمة
}

const TaskSchema = new Schema<ITask>({
  title:        { type: String, required: true },
  description:  { type: String },
  department:   { type: String, required: true },
  category:     { type: String, required: true },
  assignedTo:   [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  dueDate:      { type: Date },
  status:       { type: String, enum: ['pending','in-progress','completed','overdue'], default: 'pending' },
  incentiveAmount: { type: Number, default: 0 },
  createdBy:    { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
}, { timestamps: true });

export const Task = model<ITask>('Task', TaskSchema);
