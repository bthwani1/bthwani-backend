import mongoose, { Document, Schema } from 'mongoose';

export type BackupStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RESTORING' | 'RESTORED';
export type BackupType = 'FULL' | 'INCREMENTAL' | 'MANUAL' | 'SCHEDULED';

export interface IBackupRecord extends Document {
  type: BackupType;
  status: BackupStatus;
  fileName: string;
  filePath?: string;
  fileSize?: number; // بالبايت
  collections: string[]; // قائمة المجموعات المدعومة
  recordCount: number; // عدد السجلات المدعومة
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  checksum?: string; // للتحقق من سلامة الملف
  restoredFrom?: mongoose.Types.ObjectId; // في حالة كانت نسخة مستعادة
  createdBy: mongoose.Types.ObjectId; // من أنشأ النسخة
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BackupRecordSchema: Schema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['FULL', 'INCREMENTAL', 'MANUAL', 'SCHEDULED']
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RESTORING', 'RESTORED'],
    default: 'PENDING'
  },
  fileName: {
    type: String,
    required: true,
    unique: true
  },
  filePath: String,
  fileSize: Number,
  collections: [{
    type: String,
    required: true
  }],
  recordCount: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  errorMessage: String,
  checksum: String,
  restoredFrom: {
    type: Schema.Types.ObjectId,
    ref: 'BackupRecord'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'AdminUser'
  },
  notes: String
}, {
  timestamps: true
});

// مؤشرات للبحث السريع
BackupRecordSchema.index({ status: 1, createdAt: -1 });
BackupRecordSchema.index({ type: 1, status: 1 });
BackupRecordSchema.index({ fileName: 1 });

export default mongoose.model<IBackupRecord>('BackupRecord', BackupRecordSchema);
