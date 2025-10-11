import { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { BackupService } from '../../services/backupService';
import BackupRecord from '../../models/BackupRecord';

/**
 * إنشاء نسخة احتياطية كاملة
 */
export const createFullBackup = async (req: Request, res: Response) => {
  try {
    const createdBy = (req as any).user?.id;
    const { notes } = req.body;

    const backup = await BackupService.createFullBackup(createdBy, notes);

    res.status(201).json({
      message: 'تم إنشاء النسخة الاحتياطية بنجاح',
      backup: {
        id: backup._id,
        fileName: backup.fileName,
        status: backup.status,
        type: backup.type,
        recordCount: backup.recordCount,
        fileSize: backup.fileSize,
        createdAt: backup.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating full backup:', error);
    res.status(500).json({ message: 'خطأ في إنشاء النسخة الاحتياطية' });
  }
};

/**
 * إنشاء نسخة احتياطية تزايدية
 */
export const createIncrementalBackup = async (req: Request, res: Response) => {
  try {
    const createdBy = (req as any).user?.id;
    const { notes } = req.body;

    const backup = await BackupService.createIncrementalBackup(createdBy, notes);

    res.status(201).json({
      message: 'تم إنشاء النسخة الاحتياطية التزايدية بنجاح',
      backup: {
        id: backup._id,
        fileName: backup.fileName,
        status: backup.status,
        type: backup.type,
        recordCount: backup.recordCount,
        fileSize: backup.fileSize,
        createdAt: backup.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating incremental backup:', error);
    res.status(500).json({ message: 'خطأ في إنشاء النسخة الاحتياطية التزايدية' });
  }
};

/**
 * جلب قائمة النسخ الاحتياطية
 */
export const getBackups = async (req: Request, res: Response) => {
  try {
    const {
      status,
      type,
      page = 1,
      limit = 20
    } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (type) filters.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const { backups, total } = await BackupService.getBackups({
      ...filters,
      limit: Number(limit),
      skip
    });

    res.json({
      backups: backups.map(backup => ({
        id: backup._id,
        fileName: backup.fileName,
        type: backup.type,
        status: backup.status,
        recordCount: backup.recordCount,
        fileSize: backup.fileSize,
        createdAt: backup.createdAt,
        completedAt: backup.completedAt,
        createdBy: (backup as any).createdBy?.username,
        notes: backup.notes,
        errorMessage: backup.errorMessage
      })),
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalBackups: total,
        hasNext: skip + backups.length < total,
        hasPrev: Number(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ message: 'خطأ في جلب النسخ الاحتياطية' });
  }
};

/**
 * جلب نسخة احتياطية محددة
 */
export const getBackup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const backup = await BackupRecord.findById(id)
      .populate('createdBy', 'username')
      .populate('restoredFrom', 'fileName');

    if (!backup) {
       res.status(404).json({ message: 'النسخة الاحتياطية غير موجودة' });
       return;
    }

    res.json({
      backup: {
        id: backup._id,
        fileName: backup.fileName,
        type: backup.type,
        status: backup.status,
        recordCount: backup.recordCount,
        fileSize: backup.fileSize,
        collections: backup.collections,
        createdAt: backup.createdAt,
        completedAt: backup.completedAt,
        createdBy: (backup as any).createdBy?.username,
        notes: backup.notes,
        errorMessage: backup.errorMessage,
        checksum: backup.checksum,
        restoredFrom: (backup as any).restoredFrom?.fileName
      }
    });

  } catch (error) {
    console.error('Error fetching backup:', error);
    res.status(500).json({ message: 'خطأ في جلب النسخة الاحتياطية' });
  }
};

/**
 * استعادة من نسخة احتياطية
 */
export const restoreBackup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const createdBy = (req as any).user?.id;

    // التحقق من أن المستخدم SuperAdmin
    const userRole = (req as any).user?.roles?.[0];
    if (userRole !== 'SUPERADMIN') {
       res.status(403).json({
        message: 'هذا الإجراء متاح لمديري النظام العامين فقط',
        error: 'UNAUTHORIZED'
      });
      return;
    }

    await BackupService.restoreFromBackup(id, createdBy);

    res.json({
      message: 'تمت عملية الاستعادة بنجاح',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({
      message: error.message || 'خطأ في عملية الاستعادة'
    });
  }
};

/**
 * اختبار استعادة نسخة احتياطية
 */
export const testRestoreBackup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const createdBy = (req as any).user?.id;

    const result = await BackupService.testRestore(id, createdBy);

    if (result.success) {
      res.json({
        message: result.message,
        success: true,
        timestamp: new Date()
      });
    } else {
      res.status(400).json({
        message: result.message,
        success: false
      });
    }

  } catch (error) {
    console.error('Error testing restore:', error);
    res.status(500).json({
      message: error.message || 'خطأ في اختبار الاستعادة'
    });
  }
};

/**
 * حذف نسخة احتياطية
 */
export const deleteBackup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await BackupService.deleteBackup(id);

    res.json({
      message: 'تم حذف النسخة الاحتياطية بنجاح',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({
      message: error.message || 'خطأ في حذف النسخة الاحتياطية'
    });
  }
};

/**
 * جلب إحصائيات النسخ الاحتياطية
 */
export const getBackupStats = async (req: Request, res: Response) => {
  try {
    const totalBackups = await BackupRecord.countDocuments();
    const completedBackups = await BackupRecord.countDocuments({ status: 'COMPLETED' });
    const failedBackups = await BackupRecord.countDocuments({ status: 'FAILED' });
    const runningBackups = await BackupRecord.countDocuments({ status: 'RUNNING' });

    // إحصائيات حسب النوع
    const typeStats = await BackupRecord.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // إحصائيات حسب الحالة
    const statusStats = await BackupRecord.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // آخر نسخة احتياطية ناجحة
    const lastSuccessfulBackup = await BackupRecord.findOne({
      status: 'COMPLETED'
    }).sort({ completedAt: -1 }).populate('createdBy', 'username');

    res.json({
      summary: {
        total: totalBackups,
        completed: completedBackups,
        failed: failedBackups,
        running: runningBackups,
        successRate: totalBackups > 0 ? ((completedBackups / totalBackups) * 100).toFixed(2) : 0
      },
      byType: typeStats.reduce((acc: any, stat: any) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byStatus: statusStats.reduce((acc: any, stat: any) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      lastSuccessfulBackup: lastSuccessfulBackup ? {
        id: lastSuccessfulBackup._id,
        fileName: lastSuccessfulBackup.fileName,
        completedAt: lastSuccessfulBackup.completedAt,
        fileSize: lastSuccessfulBackup.fileSize,
        recordCount: lastSuccessfulBackup.recordCount,
        createdBy: (lastSuccessfulBackup as any).createdBy?.username
      } : null
    });

  } catch (error) {
    console.error('Error fetching backup stats:', error);
    res.status(500).json({ message: 'خطأ في جلب إحصائيات النسخ الاحتياطية' });
  }
};
