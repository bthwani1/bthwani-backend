import mongoose, { Schema, Document } from 'mongoose';

export interface ILedgerEntry extends Document {
  event_type: string; // order_paid, order_delivered, settlement_paid, etc.
  event_ref: string; // order_id, settlement_id, payout_id, etc.
  description: string;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  created_by?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>({
  event_type: {
    type: String,
    required: true
  },
  event_ref: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  total_debit: {
    type: Number,
    required: true,
    default: 0
  },
  total_credit: {
    type: Number,
    required: true,
    default: 0
  },
  is_balanced: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser'
  }
}, {
  timestamps: true
});

LedgerEntrySchema.index({ event_type: 1, event_ref: 1 });
LedgerEntrySchema.index({ createdAt: 1 });
LedgerEntrySchema.index({ is_balanced: 1 });

export default mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
