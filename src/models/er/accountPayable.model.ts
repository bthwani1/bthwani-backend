// server/src/models/accountPayable.model.ts
import { Schema, model, Document, Types } from 'mongoose';
export interface IAccountPayable extends Document {
  vendor: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
}
const AccountPayableSchema = new Schema<IAccountPayable>({
  vendor: { type: String, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending','paid','overdue'], default: 'pending' },
}, { timestamps: true });
export const AccountPayable = model<IAccountPayable>('AccountPayable', AccountPayableSchema);