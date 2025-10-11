import mongoose, { Schema, Document } from 'mongoose';

export interface ILedgerSplit extends Document {
  entry_id: mongoose.Types.ObjectId;
  account_id?: mongoose.Types.ObjectId; // reference to WalletAccount or internal account
  account_type: string; // wallet_account, psp_clearing, company_revenue, etc.
  side: 'debit' | 'credit';
  amount: number;
  currency: string;
  balance_state: 'pending' | 'available';
  memo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerSplitSchema = new Schema<ILedgerSplit>({
  entry_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'LedgerEntry'
  },
  account_id: {
    type: Schema.Types.ObjectId,
    ref: 'WalletAccount'
  },
  account_type: {
    type: String,
    required: true
  },
  side: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'SAR'
  },
  balance_state: {
    type: String,
    enum: ['pending', 'available'],
    required: true
  },
  memo: String
}, {
  timestamps: true
});

LedgerSplitSchema.index({ entry_id: 1 });
LedgerSplitSchema.index({ account_id: 1, balance_state: 1 });
LedgerSplitSchema.index({ account_type: 1, balance_state: 1 });

export default mongoose.model<ILedgerSplit>('LedgerSplit', LedgerSplitSchema);
