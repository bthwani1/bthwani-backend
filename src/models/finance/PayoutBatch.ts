import mongoose, { Schema, Document } from 'mongoose';

export interface IPayoutBatch extends Document {
  id: string; // PB-YYYYMM-####
  period_start: Date;
  period_end: Date;
  status: 'draft' | 'processing' | 'paid';
  currency: string;
  total_count: number;
  total_amount: number;
  created_by: mongoose.Types.ObjectId;
  processed_by?: mongoose.Types.ObjectId;
  processed_at?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutBatchSchema = new Schema<IPayoutBatch>({
  id: {
    type: String,
    required: true,
    unique: true,
    match: /^PB-\d{6}-\d{4}$/
  },
  period_start: {
    type: Date,
    required: true
  },
  period_end: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'processing', 'paid'],
    default: 'draft'
  },
  currency: {
    type: String,
    required: true,
    default: 'SAR'
  },
  total_count: {
    type: Number,
    required: true,
    default: 0
  },
  total_amount: {
    type: Number,
    required: true,
    default: 0
  },
  created_by: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'AdminUser'
  },
  processed_by: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  processed_at: Date,
  notes: String
}, {
  timestamps: true
});

PayoutBatchSchema.index({ status: 1, period_start: 1, period_end: 1 });
PayoutBatchSchema.index({ createdAt: 1 });

export default mongoose.model<IPayoutBatch>('PayoutBatch', PayoutBatchSchema);
