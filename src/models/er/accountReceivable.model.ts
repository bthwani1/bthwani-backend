// server/src/models/accountReceivable.model.ts
import { Schema, model, Document, Types } from 'mongoose';
export interface IAccountReceivable extends Document {
  client: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
}
const AccountReceivableSchema = new Schema<IAccountReceivable>({
  client: { type: String, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending','paid','overdue'], default: 'pending' },
}, { timestamps: true });
export const AccountReceivable = model<IAccountReceivable>('AccountReceivable', AccountReceivableSchema);