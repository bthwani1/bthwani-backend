import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  validatePassword,
  setupTwoFactorAuth,
  enableTwoFactorAuth,
  disableTwoFactorAuth,
  getTwoFactorStatus,
  regenerateBackupCodes,
  verifyTwoFactorToken,
  cleanupDefaultAccounts,
  generateSecurePassword,
  updateUserPassword
} from '../../controllers/admin/passwordSecurityController';
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
 * التحقق من قوة كلمة المرور
 */
router.post('/validate-password', [
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
], handleValidationErrors, validatePassword);

/**
 * إعداد التحقق بخطوتين
 */
router.post('/setup-2fa', [
  verifyFirebase,
  verifyAdmin,
], setupTwoFactorAuth);

/**
 * تفعيل التحقق بخطوتين
 */
router.post('/enable-2fa', [
  verifyFirebase,
  verifyAdmin,
  body('token').notEmpty().withMessage('رمز التحقق مطلوب'),
], handleValidationErrors, enableTwoFactorAuth);

/**
 * تعطيل التحقق بخطوتين
 */
router.post('/disable-2fa', [
  verifyFirebase,
  verifyAdmin,
], disableTwoFactorAuth);

/**
 * جلب حالة التحقق بخطوتين
 */
router.get('/2fa-status', [
  verifyFirebase,
  verifyAdmin,
], getTwoFactorStatus);

/**
 * إعادة إنشاء رموز احتياطية
 */
router.post('/regenerate-backup-codes', [
  verifyFirebase,
  verifyAdmin,
], regenerateBackupCodes);

/**
 * التحقق من رمز 2FA
 */
router.post('/verify-2fa', [
  verifyFirebase,
  verifyAdmin,
  body('token').notEmpty().withMessage('رمز التحقق مطلوب'),
], handleValidationErrors, verifyTwoFactorToken);

/**
 * تنظيف الحسابات الافتراضية (SuperAdmin فقط)
 */
router.post('/cleanup-default-accounts', [
  verifyFirebase,
  verifyAdmin,
], cleanupDefaultAccounts);

/**
 * إنشاء كلمة مرور آمنة
 */
router.get('/generate-secure-password', [
  verifyFirebase,
  verifyAdmin,
  query('length').optional().isInt({ min: 8, max: 128 }),
], handleValidationErrors, generateSecurePassword);

/**
 * تحديث كلمة مرور مستخدم
 */
router.put('/:id/password', [
  verifyFirebase,
  verifyAdmin,
  param('id').isMongoId().withMessage('معرف المستخدم غير صحيح'),
  body('newPassword').notEmpty().withMessage('كلمة المرور الجديدة مطلوبة'),
], handleValidationErrors, updateUserPassword);

export default router;
