import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletStatementLine extends Document {
  account_id: mongoose.Types.ObjectId;
  date: Date;
  entry_id: mongoose.Types.ObjectId;
  split_id: mongoose.Types.ObjectId;
  memo: string;
  ref_type: string; // order, settlement, payout, etc.
  ref_id?: string;
  side: 'debit' | 'credit';
  amount: number;
  balance_state: 'pending' | 'available';
  running_balance: number;
  createdAt: Date;
}

const WalletStatementLineSchema = new Schema<IWalletStatementLine>({
  account_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'WalletAccount'
  },
  date: {
    type: Date,
    required: true
  },
  entry_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'LedgerEntry'
  },
  split_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'LedgerSplit'
  },
  memo: {
    type: String,
    required: true
  },
  ref_type: {
    type: String,
    required: true
  },
  ref_id: String,
  side: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balance_state: {
    type: String,
    enum: ['pending', 'available'],
    required: true
  },
  running_balance: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

WalletStatementLineSchema.index({ account_id: 1, date: -1 });
WalletStatementLineSchema.index({ date: 1, account_id: 1 });

// Compound index for efficient queries
WalletStatementLineSchema.index({ account_id: 1, balance_state: 1, date: -1 });

export default mongoose.model<IWalletStatementLine>('WalletStatementLine', WalletStatementLineSchema);
