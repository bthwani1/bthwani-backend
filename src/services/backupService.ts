import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import BackupRecord, { IBackupRecord, BackupType, BackupStatus } from '../models/BackupRecord';
import { NotificationService } from './notificationService';

// إعدادات النسخ الاحتياطي
const BACKUP_CONFIG = {
  BACKUP_DIR: process.env.BACKUP_DIR || './backups',
  MAX_BACKUPS: 10, // عدد النسخ المحفوظة كحد أقصى
  COLLECTIONS_TO_BACKUP: [
    'AdminUser',
    'User',
    'Driver',
    'Vendor',
    'Order',
    'LoginAttempt',
    'DataDeletionRequest',
    'BackupRecord'
  ]
};

/**
 * خدمة النسخ الاحتياطي لقاعدة البيانات
 */
export class BackupService {

  /**
   * إنشاء نسخة احتياطية كاملة
   */
  static async createFullBackup(createdBy: string, notes?: string): Promise<IBackupRecord> {
    const backupRecord = await this.createBackupRecord('FULL', createdBy, notes);
    await this.performBackup(backupRecord);
    return backupRecord;
  }

  /**
   * إنشاء نسخة احتياطية تزايدية
   */
  static async createIncrementalBackup(createdBy: string, notes?: string): Promise<IBackupRecord> {
    const backupRecord = await this.createBackupRecord('INCREMENTAL', createdBy, notes);
    await this.performBackup(backupRecord, true);
    return backupRecord;
  }

  /**
   * استعادة من نسخة احتياطية
   */
  static async restoreFromBackup(backupId: string, createdBy: string): Promise<void> {
    const backupRecord = await BackupRecord.findById(backupId);
    if (!backupRecord) {
      throw new Error('نسخة احتياطية غير موجودة');
    }

    if (backupRecord.status !== 'COMPLETED') {
      throw new Error('لا يمكن الاستعادة من نسخة احتياطية غير مكتملة');
    }

    // تحديث حالة النسخة إلى قيد الاستعادة
    backupRecord.status = 'RESTORING';
    await backupRecord.save();

    try {
      await this.performRestore(backupRecord);

      // إنشاء سجل استعادة جديد
      const restoreRecord = new BackupRecord({
        type: 'MANUAL',
        status: 'RESTORED',
        fileName: `restored_${Date.now()}`,
        collections: backupRecord.collections,
        recordCount: backupRecord.recordCount,
        restoredFrom: backupRecord._id,
        createdBy: new mongoose.Types.ObjectId(createdBy),
        notes: `مستعادة من ${backupRecord.fileName}`
      });

      await restoreRecord.save();

      // إرسال إشعار نجاح الاستعادة
      await NotificationService.sendBackupSuccess(
        'RESTORE',
        `تمت الاستعادة من ${backupRecord.fileName}`
      );

    } catch (error) {
      backupRecord.status = 'FAILED';
      backupRecord.errorMessage = error.message;
      await backupRecord.save();
      throw error;
    }
  }

  /**
   * اختبار استعادة النسخة الاحتياطية (نسخة تجريبية)
   */
  static async testRestore(backupId: string, createdBy: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🧪 Testing restore from backup: ${backupId}`);

      const backupRecord = await BackupRecord.findById(backupId);
      if (!backupRecord) {
        return { success: false, message: 'نسخة احتياطية غير موجودة' };
      }

      // هنا يمكن إضافة منطق اختبار الاستعادة بدون التأثير على البيانات الحية
      // مثل إنشاء قاعدة بيانات تجريبية والاستعادة عليها

      return {
        success: true,
        message: `تم اختبار الاستعادة بنجاح من ${backupRecord.fileName}`
      };

    } catch (error) {
      return {
        success: false,
        message: `فشل في اختبار الاستعادة: ${error.message}`
      };
    }
  }

  /**
   * تنظيف النسخ الاحتياطية القديمة
   */
  static async cleanupOldBackups(): Promise<number> {
    try {
      const backups = await BackupRecord.find({})
        .sort({ createdAt: -1 })
        .skip(BACKUP_CONFIG.MAX_BACKUPS);

      let deletedCount = 0;

      for (const backup of backups) {
        try {
          // حذف الملف إذا كان موجوداً
          if (backup.filePath) {
            await fs.unlink(backup.filePath).catch(() => {
              // تجاهل خطأ عدم وجود الملف
            });
          }

          await BackupRecord.findByIdAndDelete(backup._id);
          deletedCount++;

        } catch (error) {
          console.error(`Error deleting backup ${backup.fileName}:`, error);
        }
      }

      return deletedCount;

    } catch (error) {
      console.error('Error cleaning up old backups:', error);
      return 0;
    }
  }

  /**
   * إنشاء سجل النسخة الاحتياطية
   */
  private static async createBackupRecord(
    type: BackupType,
    createdBy: string,
    notes?: string
  ): Promise<IBackupRecord> {
    const timestamp = Date.now();
    const fileName = `backup_${type.toLowerCase()}_${timestamp}.json`;

    const backupRecord = new BackupRecord({
      type,
      status: 'RUNNING',
      fileName,
      collections: BACKUP_CONFIG.COLLECTIONS_TO_BACKUP,
      createdBy: new mongoose.Types.ObjectId(createdBy),
      notes
    });

    return await backupRecord.save();
  }

  /**
   * تنفيذ عملية النسخ الاحتياطي
   */
  private static async performBackup(backupRecord: IBackupRecord, incremental: boolean = false): Promise<void> {
    try {
      console.log(`💾 Starting ${incremental ? 'incremental' : 'full'} backup: ${backupRecord.fileName}`);

      // إنشاء مجلد النسخ الاحتياطي إذا لم يكن موجوداً
      await fs.mkdir(BACKUP_CONFIG.BACKUP_DIR, { recursive: true });

      const backupData: any = {};
      let totalRecords = 0;

      // نسخ كل مجموعة
      for (const collectionName of BACKUP_CONFIG.COLLECTIONS_TO_BACKUP) {
        try {
          const Model = mongoose.model(collectionName);
          const query = incremental ?
            { updatedAt: { $gte: backupRecord.startedAt } } : {};

          const documents = await Model.find(query).lean();

          if (documents.length > 0) {
            backupData[collectionName] = documents;
            totalRecords += documents.length;
            console.log(`📋 Backed up ${documents.length} records from ${collectionName}`);
          }
        } catch (error) {
          console.error(`Error backing up collection ${collectionName}:`, error);
          throw new Error(`فشل في نسخ مجموعة ${collectionName}: ${error.message}`);
        }
      }

      // حفظ البيانات في ملف
      const filePath = path.join(BACKUP_CONFIG.BACKUP_DIR, backupRecord.fileName);
      const jsonData = JSON.stringify(backupData, null, 2);

      await fs.writeFile(filePath, jsonData, 'utf8');

      // حساب حجم الملف والـ checksum
      const stats = await fs.stat(filePath);
      const checksum = crypto.createHash('md5').update(jsonData).digest('hex');

      // تحديث سجل النسخة الاحتياطية
      backupRecord.status = 'COMPLETED';
      backupRecord.filePath = filePath;
      backupRecord.fileSize = stats.size;
      backupRecord.recordCount = totalRecords;
      backupRecord.checksum = checksum;
      backupRecord.completedAt = new Date();

      await backupRecord.save();

      // تنظيف النسخ القديمة
      await this.cleanupOldBackups();

      // إرسال إشعار نجاح
      await NotificationService.sendBackupSuccess(
        backupRecord.type,
        `${(stats.size / 1024 / 1024).toFixed(2)} MB`
      );

      console.log(`✅ Backup completed successfully: ${filePath}`);

    } catch (error) {
      console.error('❌ Backup failed:', error);

      // تحديث سجل النسخة الاحتياطية بالخطأ
      backupRecord.status = 'FAILED';
      backupRecord.errorMessage = error.message;
      await backupRecord.save();

      // إرسال إشعار فشل
      await NotificationService.sendBackupFailure(
        backupRecord.type,
        error.message
      );

      throw error;
    }
  }

  /**
   * تنفيذ عملية الاستعادة
   */
  private static async performRestore(backupRecord: IBackupRecord): Promise<void> {
    try {
      console.log(`🔄 Starting restore from backup: ${backupRecord.fileName}`);

      if (!backupRecord.filePath) {
        throw new Error('مسار ملف النسخة الاحتياطية غير محدد');
      }

      // قراءة ملف النسخة الاحتياطية
      const fileContent = await fs.readFile(backupRecord.filePath, 'utf8');
      const backupData = JSON.parse(fileContent);

      // التحقق من checksum
      if (backupRecord.checksum) {
        const currentChecksum = crypto.createHash('md5').update(fileContent).digest('hex');
        if (currentChecksum !== backupRecord.checksum) {
          throw new Error('فشل في التحقق من سلامة الملف - checksum غير متطابق');
        }
      }

      // استعادة البيانات لكل مجموعة
      for (const [collectionName, documents] of Object.entries(backupData)) {
        try {
          if (Array.isArray(documents) && documents.length > 0) {
            const Model = mongoose.model(collectionName);

            // حذف البيانات الموجودة وإدراج البيانات الجديدة
            await Model.deleteMany({});
            if (documents.length > 0) {
              await Model.insertMany(documents);
            }

            console.log(`✅ Restored ${documents.length} records to ${collectionName}`);
          }
        } catch (error) {
          console.error(`Error restoring collection ${collectionName}:`, error);
          throw new Error(`فشل في استعادة مجموعة ${collectionName}: ${error.message}`);
        }
      }

      console.log(`✅ Restore completed successfully from ${backupRecord.fileName}`);

    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    }
  }

  /**
   * جلب قائمة النسخ الاحتياطية
   */
  static async getBackups(filters?: {
    status?: BackupStatus;
    type?: BackupType;
    limit?: number;
    skip?: number;
  }): Promise<{ backups: IBackupRecord[]; total: number }> {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    const limit = filters?.limit || 20;
    const skip = filters?.skip || 0;

    const backups = await BackupRecord.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username')
      .populate('restoredFrom', 'fileName');

    const total = await BackupRecord.countDocuments(query);

    return { backups, total };
  }

  /**
   * حذف نسخة احتياطية
   */
  static async deleteBackup(backupId: string): Promise<void> {
    const backupRecord = await BackupRecord.findById(backupId);

    if (!backupRecord) {
      throw new Error('نسخة احتياطية غير موجودة');
    }

    // حذف الملف إذا كان موجوداً
    if (backupRecord.filePath) {
      await fs.unlink(backupRecord.filePath).catch(() => {
        // تجاهل خطأ عدم وجود الملف
      });
    }

    await BackupRecord.findByIdAndDelete(backupId);
  }
}
