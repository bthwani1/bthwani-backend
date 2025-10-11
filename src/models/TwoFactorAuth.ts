import mongoose, { Document, Schema } from 'mongoose';

export interface ITwoFactorAuth extends Document {
  userId: mongoose.Types.ObjectId;
  userType: 'ADMIN' | 'VENDOR' | 'DRIVER' | 'USER';
  secret: string; // السر المستخدم لتوليد رموز TOTP
  backupCodes: string[]; // رموز احتياطية مشفرة
  isEnabled: boolean;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TwoFactorAuthSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['ADMIN', 'VENDOR', 'DRIVER', 'USER']
  },
  secret: {
    type: String,
    required: true,
    unique: true
  },
  backupCodes: [{
    type: String,
    required: true
  }],
  isEnabled: {
    type: Boolean,
    default: false
  },
  lastUsed: Date
}, {
  timestamps: true
});

// مؤشرات للبحث السريع
TwoFactorAuthSchema.index({ userId: 1, userType: 1 });
TwoFactorAuthSchema.index({ isEnabled: 1 });

export default mongoose.model<ITwoFactorAuth>('TwoFactorAuth', TwoFactorAuthSchema);
