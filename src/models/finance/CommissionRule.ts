import mongoose, { Schema, Document } from 'mongoose';

export interface ICommissionRule extends Document {
  applicable_to: 'driver' | 'vendor';
  basis: 'percentage' | 'flat';
  value: number;
  min?: number;
  max?: number;
  effective_from: Date;
  effective_to?: Date;
  priority: number; // higher number = higher priority
  is_active: boolean;
  created_by: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionRuleSchema = new Schema<ICommissionRule>({
  applicable_to: {
    type: String,
    enum: ['driver', 'vendor'],
    required: true
  },
  basis: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  min: Number,
  max: Number,
  effective_from: {
    type: Date,
    required: true
  },
  effective_to: Date,
  priority: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'AdminUser'
  }
}, {
  timestamps: true
});

CommissionRuleSchema.index({ applicable_to: 1, is_active: 1, effective_from: 1, effective_to: 1 });
CommissionRuleSchema.index({ priority: -1 });

export default mongoose.model<ICommissionRule>('CommissionRule', CommissionRuleSchema);
