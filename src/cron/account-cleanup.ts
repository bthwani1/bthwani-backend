import { cleanupUnusedAccounts } from '../scripts/cleanup-unused-accounts';

/**
 * مهمة cron لتنظيف الحسابات والصلاحيات أسبوعياً
 * تشغل كل يوم أحد في الساعة 2 صباحاً
 */
export const registerAccountCleanupCron = () => {
  const cron = require('node-cron');

  // تشغيل كل أسبوع يوم الأحد في الساعة 2 صباحاً
  cron.schedule('0 2 * * 0', async () => {
    console.log('🧹 Running scheduled account cleanup...');

    try {
      const results = await cleanupUnusedAccounts();

      console.log('✅ Scheduled account cleanup completed');
      console.log(`📊 Results: ${results.accountsRemoved} accounts removed, ${results.permissionsReduced} permissions reduced`);

      if (results.errors.length > 0) {
        console.warn('🚨 Errors during cleanup:', results.errors);
      }

    } catch (error) {
      console.error('❌ Error in scheduled account cleanup:', error);
    }
  });

  console.log('✅ Account cleanup cron job registered');
};
