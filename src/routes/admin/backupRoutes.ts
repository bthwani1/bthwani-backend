import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createFullBackup,
  createIncrementalBackup,
  getBackups,
  getBackup,
  restoreBackup,
  testRestoreBackup,
  deleteBackup,
  getBackupStats
} from '../../controllers/admin/backupController';
import { verifyFirebase } from '../../middleware/verifyFirebase';
import { verifyAdmin } from '../../middleware/verifyAdmin';

const router = Router();

// Middleware للتحقق من صحة البيانات
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'خطأ في البيانات المدخلة',
      errors: errors.array(),
    });
  }
  return next();
};

/**
 * إنشاء نسخة احتياطية كاملة
 */
router.post('/create/full', [
  verifyFirebase,
  verifyAdmin,
  body('notes').optional().isLength({ max: 500 }).withMessage('الملاحظات يجب أن تكون أقل من 500 حرف'),
], handleValidationErrors, createFullBackup);

/**
 * إنشاء نسخة احتياطية تزايدية
 */
router.post('/create/incremental', [
  verifyFirebase,
  verifyAdmin,
  body('notes').optional().isLength({ max: 500 }).withMessage('الملاحظات يجب أن تكون أقل من 500 حرف'),
], handleValidationErrors, createIncrementalBackup);

/**
 * جلب قائمة النسخ الاحتياطية
 */
router.get('/list', [
  verifyFirebase,
  verifyAdmin,
  query('status').optional().isIn(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RESTORING', 'RESTORED']),
  query('type').optional().isIn(['FULL', 'INCREMENTAL', 'MANUAL', 'SCHEDULED']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], handleValidationErrors, getBackups);

/**
 * جلب نسخة احتياطية محددة
 */
router.get('/:id', [
  verifyFirebase,
  verifyAdmin,
  param('id').isMongoId().withMessage('معرف النسخة الاحتياطية غير صحيح'),
], handleValidationErrors, getBackup);

/**
 * استعادة من نسخة احتياطية (SuperAdmin فقط)
 */
router.post('/:id/restore', [
  verifyFirebase,
  verifyAdmin,
  param('id').isMongoId().withMessage('معرف النسخة الاحتياطية غير صحيح'),
], handleValidationErrors, restoreBackup);

/**
 * اختبار استعادة نسخة احتياطية
 */
router.post('/:id/test-restore', [
  verifyFirebase,
  verifyAdmin,
  param('id').isMongoId().withMessage('معرف النسخة الاحتياطية غير صحيح'),
], handleValidationErrors, testRestoreBackup);

/**
 * حذف نسخة احتياطية
 */
router.delete('/:id', [
  verifyFirebase,
  verifyAdmin,
  param('id').isMongoId().withMessage('معرف النسخة الاحتياطية غير صحيح'),
], handleValidationErrors, deleteBackup);

/**
 * جلب إحصائيات النسخ الاحتياطية
 */
router.get('/stats/summary', [
  verifyFirebase,
  verifyAdmin,
], getBackupStats);

export default router;
