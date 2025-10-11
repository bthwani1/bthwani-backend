import mongoose, { Schema, Document } from 'mongoose';

export interface IPayoutItem extends Document {
  batch_id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId; // driver wallet account
  beneficiary: string; // IBAN/MSISDN/...
  amount: number;
  fees: number;
  net_amount: number;
  export_ref?: string; // reference in bank/PSP file
  ledger_entry_id?: mongoose.Types.ObjectId;
  status: 'pending' | 'processed' | 'failed';
  error_message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutItemSchema = new Schema<IPayoutItem>({
  batch_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'PayoutBatch'
  },
  account_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'WalletAccount'
  },
  beneficiary: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  fees: {
    type: Number,
    default: 0
  },
  net_amount: {
    type: Number,
    required: true
  },
  export_ref: String,
  ledger_entry_id: {
    type: Schema.Types.ObjectId,
    ref: 'LedgerEntry'
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending'
  },
  error_message: String
}, {
  timestamps: true
});

PayoutItemSchema.index({ batch_id: 1, account_id: 1 });
PayoutItemSchema.index({ status: 1 });

export default mongoose.model<IPayoutItem>('PayoutItem', PayoutItemSchema);
