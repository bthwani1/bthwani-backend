import { AdminUser } from '../models/admin/AdminUser';

export interface NotificationData {
  type: 'SECURITY_ALERT' | 'LOGIN_ATTEMPT' | 'ACCOUNT_LOCKED' | 'SYSTEM_ALERT';
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  data?: any;
}

/**
 * خدمة الإشعارات للنظام
 */
export class NotificationService {

  /**
   * إرسال إشعار أمان عند تجاوز محاولات الدخول
   */
  static async sendSecurityAlert(
    ip: string,
    username?: string,
    attempts?: number,
    isBlocked?: boolean
  ): Promise<void> {
    try {
      const notificationData: NotificationData = {
        type: 'SECURITY_ALERT',
        title: '🚨 تنبيه أمان: محاولات دخول متكررة',
        message: `تم اكتشاف ${attempts} محاولات دخول فاشلة من العنوان ${ip}${username ? ` للمستخدم ${username}` : ''}. ${isBlocked ? 'تم حظر الحساب مؤقتاً.' : ''}`,
        priority: attempts >= 5 ? 'HIGH' : 'MEDIUM',
        data: {
          ip,
          username,
          attempts,
          isBlocked,
          timestamp: new Date()
        }
      };

      await this.sendNotification(notificationData);
      console.log(`🚨 Security alert sent: ${notificationData.message}`);
    } catch (error) {
      console.error('Error sending security alert:', error);
    }
  }

  /**
   * إرسال إشعار عام للمدراء
   */
  static async sendNotification(notificationData: NotificationData): Promise<void> {
    try {
      // البحث عن مدراء النظام لإرسال الإشعار
      const superAdmins = await AdminUser.find({
        roles: 'SUPERADMIN',
        isActive: true
      }).select('username');

      // هنا يمكن إضافة نظام إرسال الإشعارات الفعلي
      // مثل: Email, SMS, Push Notification, إلخ

      // للآن، سنقوم فقط بتسجيل الإشعار في console
      console.log('📢 NOTIFICATION:', {
        to: superAdmins.map(admin => admin.username),
        ...notificationData
      });

      // يمكن إضافة نظام حفظ الإشعارات في قاعدة البيانات
      // await NotificationModel.create(notificationData);

    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * إرسال إشعار نجاح عملية حذف البيانات
   */
  static async sendDataDeletionSuccess(userId: string, dataType: string): Promise<void> {
    const notificationData: NotificationData = {
      type: 'SYSTEM_ALERT',
      title: '✅ تم حذف البيانات بنجاح',
      message: `تم حذف بيانات ${dataType} للمستخدم ${userId} بنجاح`,
      priority: 'LOW',
      data: {
        userId,
        dataType,
        timestamp: new Date()
      }
    };

    await this.sendNotification(notificationData);
  }

  /**
   * إرسال إشعار فشل عملية حذف البيانات
   */
  static async sendDataDeletionFailure(userId: string, dataType: string, error: string): Promise<void> {
    const notificationData: NotificationData = {
      type: 'SYSTEM_ALERT',
      title: '❌ فشل في حذف البيانات',
      message: `فشل في حذف بيانات ${dataType} للمستخدم ${userId}: ${error}`,
      priority: 'HIGH',
      data: {
        userId,
        dataType,
        error,
        timestamp: new Date()
      }
    };

    await this.sendNotification(notificationData);
  }

  /**
   * إرسال إشعار تنظيف الحسابات
   */
  static async sendCleanupNotification(
    accountsRemoved: number,
    permissionsReduced: number
  ): Promise<void> {
    const notificationData: NotificationData = {
      type: 'SYSTEM_ALERT',
      title: '🧹 تم تنظيف الحسابات والصلاحيات',
      message: `تم إزالة ${accountsRemoved} حساب غير مستخدم وتقليل صلاحيات ${permissionsReduced} حساب`,
      priority: 'MEDIUM',
      data: {
        accountsRemoved,
        permissionsReduced,
        timestamp: new Date()
      }
    };

    await this.sendNotification(notificationData);
  }

  /**
   * إرسال إشعار نجاح النسخ الاحتياطي
   */
  static async sendBackupSuccess(backupType: string, size: string): Promise<void> {
    const notificationData: NotificationData = {
      type: 'SYSTEM_ALERT',
      title: '💾 تم إنشاء نسخة احتياطية بنجاح',
      message: `تم إنشاء نسخة احتياطية من نوع ${backupType} بحجم ${size}`,
      priority: 'LOW',
      data: {
        backupType,
        size,
        timestamp: new Date()
      }
    };

    await this.sendNotification(notificationData);
  }

  /**
   * إرسال إشعار فشل النسخ الاحتياطي
   */
  static async sendBackupFailure(backupType: string, error: string): Promise<void> {
    const notificationData: NotificationData = {
      type: 'SYSTEM_ALERT',
      title: '❌ فشل في إنشاء النسخة الاحتياطية',
      message: `فشل في إنشاء نسخة احتياطية من نوع ${backupType}: ${error}`,
      priority: 'CRITICAL',
      data: {
        backupType,
        error,
        timestamp: new Date()
      }
    };

    await this.sendNotification(notificationData);
  }
}
