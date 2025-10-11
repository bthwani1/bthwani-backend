import mongoose from 'mongoose';
import { AdminUser, AdminRole } from '../models/admin/AdminUser';
import { User } from '../models/user';
import Driver from '../models/Driver_app/driver';
import Vendor from '../models/vendor_app/Vendor';
import { NotificationService } from '../services/notificationService';

// إعدادات التنظيف
const CLEANUP_CONFIG = {
  // حسابات الإدارة غير المستخدمة (أكثر من 90 يوم)
  ADMIN_INACTIVE_DAYS: 90,

  // حسابات المستخدمين غير المستخدمة (أكثر من 180 يوم)
  USER_INACTIVE_DAYS: 180,

  // حسابات السائقين غير المستخدمة (أكثر من 120 يوم)
  DRIVER_INACTIVE_DAYS: 120,

  // حسابات التجار غير المستخدمة (أكثر من 150 يوم)
  VENDOR_INACTIVE_DAYS: 150,

  // الاحتفاظ بـ SuperAdmin واحد على الأقل
  MIN_SUPERADMINS: 1
};

/**
 * تنظيف الحسابات غير المستخدمة
 */
export async function cleanupUnusedAccounts(): Promise<{
  accountsRemoved: number;
  permissionsReduced: number;
  errors: string[];
}> {
  const results = {
    accountsRemoved: 0,
    permissionsReduced: 0,
    errors: [] as string[]
  };

  try {
    console.log('🧹 Starting account cleanup process...');

    // 1. تنظيف حسابات الإدارة
    await cleanupAdminAccounts(results);

    // 2. تنظيف حسابات المستخدمين
    await cleanupUserAccounts(results);

    // 3. تنظيف حسابات السائقين
    await cleanupDriverAccounts(results);

    // 4. تنظيف حسابات التجار
    await cleanupVendorAccounts(results);

    // 5. مراجعة وتقليل الصلاحيات الزائدة
    await reviewAndReducePermissions(results);

    console.log('✅ Account cleanup completed successfully');
    console.log(`📊 Summary: ${results.accountsRemoved} accounts removed, ${results.permissionsReduced} permissions reduced`);

    // إرسال إشعار بالنتائج
    await NotificationService.sendCleanupNotification(
      results.accountsRemoved,
      results.permissionsReduced
    );

    return results;

  } catch (error) {
    console.error('❌ Error during account cleanup:', error);
    results.errors.push(error.message || 'Unknown error during cleanup');
    return results;
  }
}

/**
 * تنظيف حسابات الإدارة غير المستخدمة
 */
async function cleanupAdminAccounts(results: any): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.ADMIN_INACTIVE_DAYS);

    // البحث عن حسابات إدارية غير مستخدمة (غير SuperAdmin)
    const inactiveAdmins = await AdminUser.find({
      roles: { $ne: AdminRole.SUPERADMIN },
      lastLogin: { $lt: cutoffDate },
      isActive: true
    });

    console.log(`Found ${inactiveAdmins.length} inactive admin accounts`);

    for (const admin of inactiveAdmins) {
      try {
        // عدم حذف آخر SuperAdmin
        if (admin.roles.includes(AdminRole.SUPERADMIN)) {
          const superAdminCount = await AdminUser.countDocuments({
            roles: AdminRole.SUPERADMIN,
            isActive: true,
            _id: { $ne: admin._id }
          });

          if (superAdminCount < CLEANUP_CONFIG.MIN_SUPERADMINS) {
            console.log(`Skipping SuperAdmin ${admin.username} - minimum required`);
            continue;
          }
        }

        await AdminUser.findByIdAndDelete(admin._id);
        results.accountsRemoved++;
        console.log(`Removed inactive admin account: ${admin.username}`);

      } catch (error) {
        console.error(`Error removing admin ${admin.username}:`, error);
        results.errors.push(`Failed to remove admin ${admin.username}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error cleaning admin accounts:', error);
    results.errors.push(`Admin cleanup error: ${error.message}`);
  }
}

/**
 * تنظيف حسابات المستخدمين غير المستخدمة
 */
async function cleanupUserAccounts(results: any): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.USER_INACTIVE_DAYS);

    // البحث عن مستخدمين غير نشطين وليس لديهم طلبات حديثة
    const inactiveUsers = await User.find({
      lastLogin: { $lt: cutoffDate },
      isActive: true,
      // استثناء المستخدمين الذين لديهم نشاط حديث في التطبيق
      'loginHistory.0.date': { $lt: cutoffDate }
    }).limit(100); // حذف دفعة صغيرة فقط لتجنب الحمل الزائد

    console.log(`Found ${inactiveUsers.length} inactive user accounts`);

    for (const user of inactiveUsers) {
      try {
        await User.findByIdAndDelete(user._id);
        results.accountsRemoved++;
        console.log(`Removed inactive user account: ${user._id}`);

      } catch (error) {
        console.error(`Error removing user ${user._id}:`, error);
        results.errors.push(`Failed to remove user ${user._id}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error cleaning user accounts:', error);
    results.errors.push(`User cleanup error: ${error.message}`);
  }
}

/**
 * تنظيف حسابات السائقين غير المستخدمة
 */
async function cleanupDriverAccounts(results: any): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.DRIVER_INACTIVE_DAYS);

    // البحث عن سائقين غير نشطين
    const inactiveDrivers = await Driver.find({
      lastLogin: { $lt: cutoffDate },
      isActive: true,
      status: { $ne: 'BUSY' } // لا نحذف السائقين المشغولين حالياً
    }).limit(50);

    console.log(`Found ${inactiveDrivers.length} inactive driver accounts`);

    for (const driver of inactiveDrivers) {
      try {
        await Driver.findByIdAndDelete(driver._id);
        results.accountsRemoved++;
        console.log(`Removed inactive driver account: ${driver._id}`);

      } catch (error) {
        console.error(`Error removing driver ${driver._id}:`, error);
        results.errors.push(`Failed to remove driver ${driver._id}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error cleaning driver accounts:', error);
    results.errors.push(`Driver cleanup error: ${error.message}`);
  }
}

/**
 * تنظيف حسابات التجار غير المستخدمة
 */
async function cleanupVendorAccounts(results: any): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.VENDOR_INACTIVE_DAYS);

    // البحث عن تجار غير نشطين وليس لديهم طلبات حديثة
    const inactiveVendors = await Vendor.find({
      lastLogin: { $lt: cutoffDate },
      isActive: true,
      // يمكن إضافة شروط أخرى حسب الحاجة
    }).limit(50);

    console.log(`Found ${inactiveVendors.length} inactive vendor accounts`);

    for (const vendor of inactiveVendors) {
      try {
        await Vendor.findByIdAndDelete(vendor._id);
        results.accountsRemoved++;
        console.log(`Removed inactive vendor account: ${vendor._id}`);

      } catch (error) {
        console.error(`Error removing vendor ${vendor._id}:`, error);
        results.errors.push(`Failed to remove vendor ${vendor._id}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error cleaning vendor accounts:', error);
    results.errors.push(`Vendor cleanup error: ${error.message}`);
  }
}

/**
 * مراجعة وتقليل الصلاحيات الزائدة
 */
async function reviewAndReducePermissions(results: any): Promise<void> {
  try {
    console.log('🔍 Reviewing admin permissions...');

    // قائمة بالصلاحيات الأساسية المطلوبة لكل دور
    const essentialPermissions: Record<string, string[]> = {
      [AdminRole.ADMIN]: [
        'admin.dashboard:read',
        'admin.users:read',
        'admin.drivers:read',
        'admin.vendors:read'
      ],
      [AdminRole.MANAGER]: [
        'admin.dashboard:read',
        'admin.users:read',
        'admin.drivers:read',
        'admin.drivers:write',
        'admin.vendors:read',
        'admin.vendors:write'
      ],
      [AdminRole.OPERATOR]: [
        'admin.dashboard:read',
        'admin.drivers:read',
        'admin.vendors:read'
      ]
    };

    // مراجعة صلاحيات كل مدير
    const admins = await AdminUser.find({ isActive: true });

    for (const admin of admins) {
      if (!admin.permissions || typeof admin.permissions !== 'object') {
        continue;
      }

      let permissionsReduced = 0;
      const userRole = admin.roles?.[0] || AdminRole.ADMIN;
      const requiredPermissions = essentialPermissions[userRole] || [];

      // مراجعة كل module من الصلاحيات
      for (const [moduleName, modulePermissions] of Object.entries(admin.permissions)) {
        if (typeof modulePermissions !== 'object') continue;

        for (const [action, hasPermission] of Object.entries(modulePermissions)) {
          if (hasPermission && !requiredPermissions.includes(`${moduleName}:${action}`)) {
            // إزالة الصلاحية الزائدة
            (admin.permissions as any)[moduleName][action] = false;
            permissionsReduced++;
          }
        }
      }

      if (permissionsReduced > 0) {
        await admin.save();
        results.permissionsReduced += permissionsReduced;
        console.log(`Reduced ${permissionsReduced} permissions for admin: ${admin.username}`);
      }
    }

  } catch (error) {
    console.error('Error reviewing permissions:', error);
    results.errors.push(`Permission review error: ${error.message}`);
  }
}

/**
 * تشغيل التنظيف اليدوي
 */
if (require.main === module) {
  // الاتصال بقاعدة البيانات
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bthwani')
    .then(async () => {
      console.log('Connected to MongoDB');

      const results = await cleanupUnusedAccounts();

      console.log('\n📋 CLEANUP RESULTS:');
      console.log(`✅ Accounts removed: ${results.accountsRemoved}`);
      console.log(`🔒 Permissions reduced: ${results.permissionsReduced}`);
      console.log(`❌ Errors: ${results.errors.length}`);

      if (results.errors.length > 0) {
        console.log('\n🚨 ERRORS:');
        results.errors.forEach(error => console.log(`  - ${error}`));
      }

      process.exit(0);
    })
    .catch(error => {
      console.error('Database connection error:', error);
      process.exit(1);
    });
}

export default cleanupUnusedAccounts;
