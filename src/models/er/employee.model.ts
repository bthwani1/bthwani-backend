// server/src/models/employee.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IEmployee extends Document {
  fullName: string;
  email: string;
  hireDate: Date;
  role: string;
  status: 'active' | 'inactive';
}

const EmployeeSchema = new Schema<IEmployee>({
  fullName: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  hireDate: { type: Date,   required: true },
  role:     { type: String, required: true },
  status:   { type: String, enum: ['active','inactive'], default: 'active' },
}, { timestamps: true });

export const Employee = model<IEmployee>('Employee', EmployeeSchema);