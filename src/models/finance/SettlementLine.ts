import mongoose, { Schema, Document } from 'mongoose';

export interface ISettlementLine extends Document {
  settlement_id: mongoose.Types.ObjectId;
  ref_type: 'order' | 'manual_adjustment';
  ref_id: string; // order_id or external reference
  description: string;
  amount: number; // positive for amounts owed to the entity
  ledger_entry_id?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementLineSchema = new Schema<ISettlementLine>({
  settlement_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Settlement'
  },
  ref_type: {
    type: String,
    enum: ['order', 'manual_adjustment'],
    required: true
  },
  ref_id: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  ledger_entry_id: {
    type: Schema.Types.ObjectId,
    ref: 'LedgerEntry'
  }
}, {
  timestamps: true
});

SettlementLineSchema.index({ settlement_id: 1, ref_id: 1 });
SettlementLineSchema.index({ ref_type: 1, ref_id: 1 });

export default mongoose.model<ISettlementLine>('SettlementLine', SettlementLineSchema);
