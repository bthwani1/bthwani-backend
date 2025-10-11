import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginAttempt extends Document {
  ip: string;
  username?: string;
  email?: string;
  attempts: number;
  lastAttempt: Date;
  blockedUntil?: Date;
  isBlocked: boolean;
}

const LoginAttemptSchema: Schema = new Schema({
  ip: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    index: true
  },
  email: {
    type: String,
    index: true
  },
  attempts: {
    type: Number,
    default: 1,
    min: 0
  },
  lastAttempt: {
    type: Date,
    default: Date.now,
    index: true
  },
  blockedUntil: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

// مؤشر مركب للبحث السريع
LoginAttemptSchema.index({ ip: 1, lastAttempt: -1 });
LoginAttemptSchema.index({ username: 1, lastAttempt: -1 });
LoginAttemptSchema.index({ email: 1, lastAttempt: -1 });

// خاصية محسوبة للتحقق من الحظر
LoginAttemptSchema.virtual('isBlocked').get(function() {
  return this.blockedUntil && this.blockedUntil > new Date();
});

// تنظيف السجلات القديمة تلقائياً (أكثر من يوم)
LoginAttemptSchema.index({ lastAttempt: 1 }, {
  expireAfterSeconds: 24 * 60 * 60 // يوم واحد
});

export default mongoose.model<ILoginAttempt>('LoginAttempt', LoginAttemptSchema);
