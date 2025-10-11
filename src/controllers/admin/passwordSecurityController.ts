import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { PasswordSecurityService } from '../../services/passwordSecurityService';
import { AdminUser } from '../../models/admin/AdminUser';

/**
 * التحقق من قوة كلمة المرور (للواجهات)
 */
export const validatePassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
       res.status(400).json({
        message: 'كلمة المرور مطلوبة',
        error: 'PASSWORD_REQUIRED'
      });
      return;
    }

    const validation = PasswordSecurityService.validatePasswordStrength(password);

    res.json({
      isValid: validation.isValid,
      strength: validation.strength,
      errors: validation.errors,
      requirements: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true
      }
    });

  } catch (error) {
    console.error('Error validating password:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

/**
 * إعداد التحقق بخطوتين
 */
export const setupTwoFactorAuth = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userType = 'ADMIN'; // يمكن تخصيصه حسب نوع المستخدم

    const setupData = await PasswordSecurityService.setupTwoFactorAuth(userId, userType);

    res.json({
      message: 'تم إعداد التحقق بخطوتين بنجاح',
      secret: setupData.secret,
      qrCodeUrl: setupData.qrCodeUrl,
      backupCodes: setupData.backupCodes,
      note: 'احفظ رموز الاحتياط في مكان آمن - لن تظهر مرة أخرى'
    });

  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({
      message: error.message || 'خطأ في إعداد التحقق بخطوتين'
    });
  }
};

/**
 * تفعيل التحقق بخطوتين
 */
export const enableTwoFactorAuth = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { token } = req.body;

    if (!token) {
       res.status(400).json({
        message: 'رمز التحقق مطلوب',
        error: 'TOKEN_REQUIRED'
      });
      return;
    }

    await PasswordSecurityService.enableTwoFactorAuth(userId, token, 'ADMIN');

    res.json({
      message: 'تم تفعيل التحقق بخطوتين بنجاح',
      note: 'تأكد من حفظ رموز الاحتياط في مكان آمن'
    });

  } catch (error) {
    console.error('Error enabling 2FA:', error);
    res.status(400).json({
      message: error.message || 'خطأ في تفعيل التحقق بخطوتين'
    });
  }
};

/**
 * تعطيل التحقق بخطوتين
 */
export const disableTwoFactorAuth = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    await PasswordSecurityService.disableTwoFactorAuth(userId);

    res.json({
      message: 'تم تعطيل التحقق بخطوتين بنجاح'
    });

  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(400).json({
      message: error.message || 'خطأ في تعطيل التحقق بخطوتين'
    });
  }
};

/**
 * جلب حالة التحقق بخطوتين
 */
export const getTwoFactorStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const status = await PasswordSecurityService.getTwoFactorStatus(userId);

    res.json({
      twoFactorAuth: status
    });

  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

/**
 * إعادة إنشاء رموز احتياطية
 */
export const regenerateBackupCodes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const newCodes = await PasswordSecurityService.regenerateBackupCodes(userId);

    res.json({
      message: 'تم إعادة إنشاء رموز الاحتياط بنجاح',
      backupCodes: newCodes,
      note: 'احفظ هذه الرموز في مكان آمن - لن تظهر مرة أخرى'
    });

  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    res.status(400).json({
      message: error.message || 'خطأ في إعادة إنشاء رموز الاحتياط'
    });
  }
};

/**
 * التحقق من رمز 2FA (للدخول)
 */
export const verifyTwoFactorToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { token } = req.body;

    if (!token) {
       res.status(400).json({
        message: 'رمز التحقق مطلوب',
        error: 'TOKEN_REQUIRED'
      });
      return;
    }

    const result = await PasswordSecurityService.verifyTwoFactorToken(userId, token);

    if (result.valid) {
      res.json({
        message: 'تم التحقق بنجاح',
        verified: true,
        usedBackupCode: result.usedBackupCode || false
      });
    } else {
      res.status(401).json({
        message: 'رمز التحقق غير صحيح',
        error: 'INVALID_TOKEN'
      });
    }

  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

/**
 * تنظيف الحسابات الافتراضية (للمدراء فقط)
 */
export const cleanupDefaultAccounts = async (req: Request, res: Response) => {
  try {
    // التحقق من أن المستخدم SuperAdmin
    const userRole = (req as any).user?.roles?.[0];
    if (userRole !== 'SUPERADMIN') {
       res.status(403).json({
        message: 'هذا الإجراء متاح لمديري النظام العامين فقط',
        error: 'UNAUTHORIZED'
      });
      return;
    }

    const results = await PasswordSecurityService.cleanupDefaultAccounts();

    res.json({
      message: 'تم تنظيف الحسابات الافتراضية بنجاح',
      results,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error cleaning up default accounts:', error);
    res.status(500).json({ message: 'خطأ في تنظيف الحسابات الافتراضية' });
  }
};

/**
 * إنشاء كلمة مرور آمنة (للمدراء)
 */
export const generateSecurePassword = async (req: Request, res: Response) => {
  try {
    const { length = 16 } = req.query;

    const password = PasswordSecurityService.generateSecurePassword(Number(length));

    res.json({
      password,
      strength: PasswordSecurityService.validatePasswordStrength(password).strength,
      note: 'استخدم هذه الكلمة لإنشاء حسابات جديدة أو تحديث كلمات مرور موجودة'
    });

  } catch (error) {
    console.error('Error generating secure password:', error);
    res.status(500).json({ message: 'خطأ في إنشاء كلمة مرور آمنة' });
  }
};

/**
 * تحديث كلمة مرور مستخدم مع التحقق من القوة
 */
export const updateUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const currentUserId = (req as any).user?.id;

    // التحقق من صحة كلمة المرور الجديدة
    const validation = PasswordSecurityService.validatePasswordStrength(newPassword);

    if (!validation.isValid) {
       res.status(400).json({
        message: 'كلمة المرور لا تستوفي متطلبات الأمان',
        errors: validation.errors,
        error: 'WEAK_PASSWORD'
      });
      return;
    }

    // البحث عن المستخدم
    const user = await AdminUser.findById(id);

    if (!user) {
       res.status(404).json({ message: 'المستخدم غير موجود' });
       return;
    }

    // التحقق من الصلاحية (نفسه أو مدير)
    const userRole = (req as any).user?.roles?.[0];
    if (user._id.toString() !== currentUserId && userRole !== 'SUPERADMIN') {
       res.status(403).json({
        message: 'غير مصرح لك بتحديث كلمة مرور هذا المستخدم',
        error: 'UNAUTHORIZED'
      });
      return;
      }

    // تحديث كلمة المرور
    user.password = await PasswordSecurityService.hashPassword(newPassword);
    await user.save();

    res.json({
      message: 'تم تحديث كلمة المرور بنجاح',
      passwordStrength: validation.strength
    });

  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({ message: 'خطأ في تحديث كلمة المرور' });
  }
};
