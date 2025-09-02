import { Schema, model, Document, Types } from 'mongoose';
export interface ILedgerEntry extends Document {
  date: Date;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  refType: string;
  refId: Types.ObjectId;
}
const LedgerEntrySchema = new Schema<ILedgerEntry>({
  date: { type: Date, default: () => new Date() },
  description: { type: String, required: true },
  debitAccount: { type: String, required: true },
  creditAccount: { type: String, required: true },
  amount: { type: Number, required: true },
  refType: { type: String, required: true },
  refId: { type: Schema.Types.ObjectId, required: true },
}, { timestamps: true });
export const LedgerEntry = model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);