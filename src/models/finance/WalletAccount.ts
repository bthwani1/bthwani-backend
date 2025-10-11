import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletAccount extends Document {
  owner_type: 'driver' | 'vendor' | 'company' | 'user';
  owner_id: mongoose.Types.ObjectId;
  currency: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const WalletAccountSchema = new Schema<IWalletAccount>({
  owner_type: {
    type: String,
    enum: ['driver', 'vendor', 'company', 'user'],
    required: true
  },
  owner_id: {
    type: Schema.Types.ObjectId,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'SAR'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

WalletAccountSchema.index({ owner_type: 1, owner_id: 1 }, { unique: true });
WalletAccountSchema.index({ status: 1 });

export default mongoose.model<IWalletAccount>('WalletAccount', WalletAccountSchema);
