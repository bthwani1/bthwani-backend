import mongoose, { Schema, Document } from 'mongoose';

export interface ISettlement extends Document {
  id: string; // S-YYYYMM-#### format
  type: 'driver' | 'vendor';
  period_start: Date;
  period_end: Date;
  currency: string;
  status: 'draft' | 'ready' | 'paid' | 'canceled';
  payable_account_id: mongoose.Types.ObjectId;
  gross_amount: number;
  fees: number;
  adjustments: number;
  net_amount: number;
  created_by: mongoose.Types.ObjectId;
  paid_by?: mongoose.Types.ObjectId;
  paid_at?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>({
  id: {
    type: String,
    required: true,
    unique: true,
    match: /^S-\d{6}-\d{4}$/
  },
  type: {
    type: String,
    enum: ['driver', 'vendor'],
    required: true
  },
  period_start: {
    type: Date,
    required: true
  },
  period_end: {
    type: Date,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'SAR'
  },
  status: {
    type: String,
    enum: ['draft', 'ready', 'paid', 'canceled'],
    default: 'draft'
  },
  payable_account_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'WalletAccount'
  },
  gross_amount: {
    type: Number,
    required: true,
    default: 0
  },
  fees: {
    type: Number,
    default: 0
  },
  adjustments: {
    type: Number,
    default: 0
  },
  net_amount: {
    type: Number,
    required: true,
    default: 0
  },
  created_by: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'AdminUser'
  },
  paid_by: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  paid_at: Date,
  notes: String
}, {
  timestamps: true
});

SettlementSchema.index({ type: 1, status: 1, period_start: 1, period_end: 1 });
SettlementSchema.index({ payable_account_id: 1 });

export default mongoose.model<ISettlement>('Settlement', SettlementSchema);
