import { BackupService } from '../services/backupService';

/**
 * مهمة cron لإنشاء نسخة احتياطية يومية
 * تشغل كل يوم في الساعة 2 صباحاً
 */
export const registerBackupCron = () => {
  const cron = require('node-cron');

  // نسخة احتياطية يومية في الساعة 2 صباحاً
  cron.schedule('0 2 * * *', async () => {
    console.log('💾 Running scheduled daily backup...');

    try {
      const backup = await BackupService.createFullBackup(
        'system', // تم إنشاؤها بواسطة النظام
        'نسخة احتياطية يومية تلقائية'
      );

      console.log('✅ Daily backup completed successfully');
      console.log(`📋 Backup: ${backup.fileName} (${backup.recordCount} records, ${backup.fileSize} bytes)`);

    } catch (error) {
      console.error('❌ Error in scheduled backup:', error);
    }
  });

  // نسخة احتياطية تزايدية كل 6 ساعات
  cron.schedule('0 */6 * * *', async () => {
    console.log('💾 Running scheduled incremental backup...');

    try {
      const backup = await BackupService.createIncrementalBackup(
        'system',
        'نسخة احتياطية تزايدية كل 6 ساعات'
      );

      console.log('✅ Incremental backup completed successfully');
      console.log(`📋 Backup: ${backup.fileName} (${backup.recordCount} records, ${backup.fileSize} bytes)`);

    } catch (error) {
      console.error('❌ Error in scheduled incremental backup:', error);
    }
  });

  console.log('✅ Backup cron jobs registered');
};
