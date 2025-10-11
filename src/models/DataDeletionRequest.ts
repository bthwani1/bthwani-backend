import mongoose, { Document, Schema } from 'mongoose';

export type DeletionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface IDataDeletionRequest extends Document {
  userId: mongoose.Types.ObjectId;
  userType: 'ADMIN' | 'VENDOR' | 'DRIVER' | 'USER';
  requestedBy: mongoose.Types.ObjectId; // من طلب الحذف (المستخدم نفسه أو مدير)
  reason?: string;
  dataTypes: string[]; // أنواع البيانات المطلوب حذفها
  status: DeletionStatus;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  adminNotes?: string;
  verificationToken?: string; // للتأكد من صحة الطلب
}

const DataDeletionRequestSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['ADMIN', 'VENDOR', 'DRIVER', 'USER']
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    required: true
  },
  reason: {
    type: String,
    maxlength: 500
  },
  dataTypes: [{
    type: String,
    required: true,
    enum: [
      'PROFILE',      // البيانات الشخصية
      'ORDERS',       // الطلبات والمعاملات
      'PAYMENTS',     // بيانات الدفع
      'LOCATIONS',    // مواقع التتبع
      'COMMUNICATIONS', // الرسائل والتواصل
      'LOGS',         // سجلات النشاط
      'ALL'           // كل البيانات
    ]
  }],
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  completedAt: Date,
  errorMessage: String,
  adminNotes: String,
  verificationToken: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// مؤشرات للبحث السريع
DataDeletionRequestSchema.index({ userId: 1, status: 1 });
DataDeletionRequestSchema.index({ requestedBy: 1, status: 1 });
DataDeletionRequestSchema.index({ status: 1, requestedAt: -1 });
DataDeletionRequestSchema.index({ verificationToken: 1 });

export default mongoose.model<IDataDeletionRequest>('DataDeletionRequest', DataDeletionRequestSchema);
