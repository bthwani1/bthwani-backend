import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createDataDeletionRequest,
  getDataDeletionRequests,
  getDataDeletionRequest,
  cancelDataDeletionRequest,
  processDataDeletionRequest
} from '../../controllers/admin/dataDeletionController';
import { verifyFirebase } from '../../middleware/verifyFirebase';
import { verifyAdmin } from '../../middleware/verifyAdmin';

const router = Router();

// Middleware للتحقق من صحة البيانات
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(400).json({
      message: 'خطأ في البيانات المدخلة',
      errors: errors.array(),
    });
    return;
  }
  return next();
};

/**
 * إنشاء طلب حذف بيانات جديد
 * يمكن للمستخدمين والمدراء إنشاء طلبات حذف
 */
router.post('/request', [
  verifyFirebase,
  body('userId').isMongoId().withMessage('معرف المستخدم غير صحيح'),
  body('userType').isIn(['ADMIN', 'VENDOR', 'DRIVER', 'USER']).withMessage('نوع المستخدم غير صحيح'),
  body('dataTypes').isArray({ min: 1 }).withMessage('يجب تحديد نوع واحد على الأقل من البيانات'),
  body('dataTypes.*').isIn(['PROFILE', 'ORDERS', 'PAYMENTS', 'LOCATIONS', 'COMMUNICATIONS', 'LOGS', 'ALL']).withMessage('نوع البيانات غير صحيح'),
  body('reason').optional().isLength({ max: 500 }).withMessage('السبب يجب أن يكون أقل من 500 حرف'),
], handleValidationErrors, createDataDeletionRequest);

/**
 * جلب طلبات حذف البيانات (للمدراء فقط)
 */
router.get('/requests', [
  verifyFirebase,
  verifyAdmin,
  query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']),
  query('userType').optional().isIn(['ADMIN', 'VENDOR', 'DRIVER', 'USER']),
  query('userId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], handleValidationErrors, getDataDeletionRequests);

/**
 * جلب طلب حذف محدد
 */
router.get('/requests/:id', [
  verifyFirebase,
  verifyAdmin,
  param('id').isMongoId().withMessage('معرف طلب الحذف غير صحيح'),
], handleValidationErrors, getDataDeletionRequest);

/**
 * إلغاء طلب حذف (للطالب أو مدير)
 */
router.delete('/requests/:id/cancel', [
  verifyFirebase,
  param('id').isMongoId().withMessage('معرف طلب الحذف غير صحيح'),
], handleValidationErrors, cancelDataDeletionRequest);

/**
 * معالجة طلب حذف (للمدراء فقط)
 * الموافقة أو الرفض
 */
router.post('/requests/:id/process', [
  verifyFirebase,
  verifyAdmin,
  param('id').isMongoId().withMessage('معرف طلب الحذف غير صحيح'),
  body('action').isIn(['approve', 'reject']).withMessage('الإجراء يجب أن يكون approve أو reject'),
  body('adminNotes').optional().isLength({ max: 1000 }).withMessage('الملاحظات يجب أن تكون أقل من 1000 حرف'),
], handleValidationErrors, processDataDeletionRequest);

/**
 * جلب إحصائيات طلبات الحذف (للمدراء)
 */
router.get('/requests/stats/summary', [
  verifyFirebase,
  verifyAdmin,
], async (req: Request, res: Response) => {
  try {
    const DataDeletionRequest = require('../../models/DataDeletionRequest').default;

    const stats = await DataDeletionRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRequests = await DataDeletionRequest.countDocuments();
    const pendingRequests = await DataDeletionRequest.countDocuments({ status: 'PENDING' });
    const processingRequests = await DataDeletionRequest.countDocuments({ status: 'PROCESSING' });
    const completedRequests = await DataDeletionRequest.countDocuments({ status: 'COMPLETED' });

    res.json({
      total: totalRequests,
      pending: pendingRequests,
      processing: processingRequests,
      completed: completedRequests,
      failed: await DataDeletionRequest.countDocuments({ status: 'FAILED' }),
      cancelled: await DataDeletionRequest.countDocuments({ status: 'CANCELLED' }),
      byStatus: stats.reduce((acc: any, stat: any) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Error fetching data deletion stats:', error);
    res.status(500).json({ message: 'خطأ في جلب الإحصائيات' });
  }
});

export default router;
