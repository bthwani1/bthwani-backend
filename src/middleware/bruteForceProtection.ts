import { Request, Response, NextFunction } from 'express';
import LoginAttempt from '../models/LoginAttempt';
import { NotificationService } from '../services/notificationService';

// إعدادات الحماية
const MAX_ATTEMPTS = 5; // عدد المحاولات المسموح بها
const LOCK_TIME = 15 * 60 * 1000; // 15 دقيقة حظر
const WINDOW_TIME = 15 * 60 * 1000; // نافذة زمنية 15 دقيقة

/**
 * Middleware لحماية من هجمات الدخول المتكررة
 */
export const bruteForceProtection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const { username, email } = req.body;

    // البحث عن سجل محاولات الدخول
    let attemptRecord = await LoginAttempt.findOne({
      $or: [
        { ip: clientIP },
        ...(username ? [{ username }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    // إذا كان المستخدم محظوراً، ارفض الطلب
    if (attemptRecord && attemptRecord.isBlocked) {
      const remainingTime = Math.ceil((attemptRecord.blockedUntil!.getTime() - Date.now()) / 1000 / 60);

      res.status(423).json({
        message: `تم حظر الحساب مؤقتاً. يرجى المحاولة مرة أخرى بعد ${remainingTime} دقيقة.`,
        error: 'ACCOUNT_LOCKED',
        remainingTime
      });
      return;
    }

    // إضافة معلومات المحاولة للـ request لاستخدامها في معالجات الأخطاء
    (req as any).loginAttempt = {
      ip: clientIP,
      username,
      email,
      attemptRecord
    };

    next();
  } catch (error) {
    console.error('Brute force protection error:', error);
    // في حالة خطأ، نسمح بالمرور لعدم إعاقة المستخدمين الشرعيين
    next();
  }
};

/**
 * دالة لتسجيل محاولة دخول فاشلة
 */
export const recordFailedAttempt = async (req: Request): Promise<boolean> => {
  try {
    const { loginAttempt } = req as any;
    if (!loginAttempt) return false;

    const { ip, username, email } = loginAttempt;
    const now = new Date();

    let attemptRecord = await LoginAttempt.findOne({
      $or: [
        { ip },
        ...(username ? [{ username }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    if (attemptRecord) {
      // تحديث المحاولات الحالية
      const timeDiff = now.getTime() - attemptRecord.lastAttempt.getTime();
      const isInWindow = timeDiff < WINDOW_TIME;

      if (isInWindow) {
        // داخل النافذة الزمنية، زد المحاولات
        attemptRecord.attempts += 1;
        attemptRecord.lastAttempt = now;

        // إذا تجاوز الحد الأقصى، احظر المستخدم
        if (attemptRecord.attempts >= MAX_ATTEMPTS) {
          attemptRecord.blockedUntil = new Date(now.getTime() + LOCK_TIME);
          console.warn(`🚨 SECURITY: Account blocked due to multiple failed attempts - IP: ${ip}, Username: ${username || email}`);

          // إرسال إشعار أمان
          await NotificationService.sendSecurityAlert(
            ip,
            username || email,
            attemptRecord.attempts,
            true
          );
        }
      } else {
        // خارج النافذة الزمنية، ابدأ من جديد
        attemptRecord.attempts = 1;
        attemptRecord.lastAttempt = now;
        attemptRecord.blockedUntil = undefined;
      }

      await attemptRecord.save();
    } else {
      // إنشاء سجل جديد
      attemptRecord = new LoginAttempt({
        ip,
        username,
        email,
        attempts: 1,
        lastAttempt: now
      });
      await attemptRecord.save();
    }

    return attemptRecord.attempts >= MAX_ATTEMPTS;
  } catch (error) {
    console.error('Error recording failed attempt:', error);
    return false;
  }
};

/**
 * دالة لإعادة تعيين المحاولات عند دخول ناجح
 */
export const resetFailedAttempts = async (req: Request): Promise<void> => {
  try {
    const { loginAttempt } = req as any;
    if (!loginAttempt) return;

    const { ip, username, email } = loginAttempt;

    await LoginAttempt.updateMany(
      {
        $or: [
          { ip },
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      },
      {
        $set: {
          attempts: 0,
          blockedUntil: undefined,
          lastAttempt: new Date()
        }
      }
    );
  } catch (error) {
    console.error('Error resetting failed attempts:', error);
  }
};

/**
 * دالة للحصول على معلومات حالة الحماية
 */
export const getProtectionStatus = async (ip: string, identifier?: string) => {
  try {
    const query: any = { ip };
    if (identifier) {
      query.$or = [
        { username: identifier },
        { email: identifier }
      ];
    }

    const record = await LoginAttempt.findOne(query);

    if (!record) {
      return {
        attempts: 0,
        isBlocked: false,
        remainingTime: 0
      };
    }

    return {
      attempts: record.attempts,
      isBlocked: record.isBlocked,
      remainingTime: record.blockedUntil ?
        Math.ceil((record.blockedUntil.getTime() - Date.now()) / 1000 / 60) : 0
    };
  } catch (error) {
    console.error('Error getting protection status:', error);
    return {
      attempts: 0,
      isBlocked: false,
      remainingTime: 0
    };
  }
};
