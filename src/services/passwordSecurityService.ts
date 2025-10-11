import bcrypt from 'bcrypt';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import TwoFactorAuth from '../models/TwoFactorAuth';
import { AdminUser } from '../models/admin/AdminUser';

/**
 * خدمة أمان كلمات المرور والتحقق بخطوتين
 */
export class PasswordSecurityService {

  // قواعد كلمات المرور القوية
  private static PASSWORD_REQUIREMENTS = {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    preventCommonPasswords: true,
    preventSequential: true
  };

  // قائمة كلمات المرور الشائعة (يجب تحديثها بانتظام)
  private static COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  /**
   * التحقق من قوة كلمة المرور
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'WEAK' | 'MEDIUM' | 'STRONG' | 'VERY_STRONG';
  } {
    const errors: string[] = [];

    // التحقق من الطول
    if (password.length < this.PASSWORD_REQUIREMENTS.minLength) {
      errors.push(`كلمة المرور يجب أن تكون ${this.PASSWORD_REQUIREMENTS.minLength} حرف على الأقل`);
    }

    if (password.length > this.PASSWORD_REQUIREMENTS.maxLength) {
      errors.push(`كلمة المرور يجب أن تكون أقل من ${this.PASSWORD_REQUIREMENTS.maxLength} حرف`);
    }

    // التحقق من الحروف الكبيرة
    if (this.PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
    }

    // التحقق من الحروف الصغيرة
    if (this.PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
    }

    // التحقق من الأرقام
    if (this.PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
    }

    // التحقق من الرموز
    if (this.PASSWORD_REQUIREMENTS.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
    }

    // التحقق من عدم وجود كلمات مرور شائعة
    if (this.PASSWORD_REQUIREMENTS.preventCommonPasswords) {
      const lowerPassword = password.toLowerCase();
      if (this.COMMON_PASSWORDS.some(common => lowerPassword.includes(common))) {
        errors.push('كلمة المرور تحتوي على كلمات مرور شائعة');
      }
    }

    // التحقق من عدم وجود تسلسل
    if (this.PASSWORD_REQUIREMENTS.preventSequential) {
      if (/(.)\1{2,}/.test(password)) {
        errors.push('كلمة المرور لا يجب أن تحتوي على تكرار لنفس الحرف أكثر من مرتين متتاليتين');
      }

      // التحقق من التسلسل البسيط (123, abc, إلخ)
      if (/123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
        errors.push('كلمة المرور لا يجب أن تحتوي على تسلسلات بسيطة');
      }
    }

    // حساب قوة كلمة المرور
    let strength: 'WEAK' | 'MEDIUM' | 'STRONG' | 'VERY_STRONG' = 'WEAK';

    if (password.length >= 16 && errors.length === 0) {
      strength = 'VERY_STRONG';
    } else if (password.length >= 12 && errors.length <= 1) {
      strength = 'STRONG';
    } else if (password.length >= 8 && errors.length <= 2) {
      strength = 'MEDIUM';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  }

  /**
   * تشفير كلمة المرور
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * التحقق من كلمة المرور
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * إنشاء رمز TOTP سري جديد
   */
  static generateTOTPSecret(): string {
    return speakeasy.generateSecret({
      name: 'bThwani',
      issuer: 'bThwani Platform'
    }).base32;
  }

  /**
   * إنشاء رمز QR للـ TOTP
   */
  static generateQRCodeURL(secret: string, username: string): string {
    return speakeasy.otpauthURL({
      secret: secret,
      label: username,
      issuer: 'bThwani Platform',
      encoding: 'base32'
    });
  }

  /**
   * التحقق من رمز TOTP
   */
  static verifyTOTP(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // قبول الرموز خلال نافذة زمنية ±2
    });
  }

  /**
   * إنشاء رموز احتياطية
   */
  static generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // إنشاء رمز من 8 أرقام عشوائية
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      codes.push(code);
    }

    return codes;
  }

  /**
   * تشفير رموز الاحتياط
   */
  static async hashBackupCodes(codes: string[]): Promise<string[]> {
    const hashedCodes: string[] = [];

    for (const code of codes) {
      const hashedCode = await bcrypt.hash(code, 10);
      hashedCodes.push(hashedCode);
    }

    return hashedCodes;
  }

  /**
   * التحقق من رمز احتياطي
   */
  static async verifyBackupCode(code: string, hashedCodes: string[]): Promise<boolean> {
    for (const hashedCode of hashedCodes) {
      if (await bcrypt.compare(code, hashedCode)) {
        return true;
      }
    }
    return false;
  }

  /**
   * إعداد 2FA للمستخدم
   */
  static async setupTwoFactorAuth(
    userId: string,
    userType: 'ADMIN' | 'VENDOR' | 'DRIVER' | 'USER'
  ): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    // التحقق من عدم وجود إعداد سابق
    const existing2FA = await TwoFactorAuth.findOne({ userId });
    if (existing2FA) {
      throw new Error('التحقق بخطوتين مفعل بالفعل لهذا المستخدم');
    }

    // إنشاء السر الجديد
    const secret = this.generateTOTPSecret();
    const backupCodes = this.generateBackupCodes();

    // تشفير رموز الاحتياط
    const hashedBackupCodes = await this.hashBackupCodes(backupCodes);

    // إنشاء سجل 2FA
    const twoFactorAuth = new TwoFactorAuth({
      userId,
      userType,
      secret,
      backupCodes: hashedBackupCodes,
      isEnabled: false // سيتم تفعيله بعد التحقق من الرمز الأول
    });

    await twoFactorAuth.save();

    // إنشاء رابط QR code
    const admin = await AdminUser.findById(userId);
    const username = admin?.username || `user_${userId}`;
    const qrCodeUrl = this.generateQRCodeURL(secret, username);

    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * تفعيل 2FA بعد التحقق من الرمز
   */
  static async enableTwoFactorAuth(
    userId: string,
    token: string,
    userType: 'ADMIN' | 'VENDOR' | 'DRIVER' | 'USER'
  ): Promise<boolean> {
    const twoFactorAuth = await TwoFactorAuth.findOne({ userId });

    if (!twoFactorAuth) {
      throw new Error('لم يتم إعداد التحقق بخطوتين لهذا المستخدم');
    }

    if (twoFactorAuth.isEnabled) {
      throw new Error('التحقق بخطوتين مفعل بالفعل');
    }

    // التحقق من الرمز
    const isValidToken = this.verifyTOTP(token, twoFactorAuth.secret);

    if (!isValidToken) {
      throw new Error('رمز التحقق غير صحيح');
    }

    // تفعيل 2FA
    twoFactorAuth.isEnabled = true;
    twoFactorAuth.lastUsed = new Date();
    await twoFactorAuth.save();

    return true;
  }

  /**
   * تعطيل 2FA
   */
  static async disableTwoFactorAuth(userId: string): Promise<void> {
    const twoFactorAuth = await TwoFactorAuth.findOne({ userId });

    if (!twoFactorAuth) {
      throw new Error('التحقق بخطوتين غير مفعل لهذا المستخدم');
    }

    await TwoFactorAuth.findByIdAndDelete(twoFactorAuth._id);
  }

  /**
   * التحقق من رمز 2FA أو رمز احتياطي
   */
  static async verifyTwoFactorToken(
    userId: string,
    token: string
  ): Promise<{ valid: boolean; usedBackupCode?: boolean }> {
    const twoFactorAuth = await TwoFactorAuth.findOne({ userId });

    if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
      return { valid: false };
    }

    // محاولة التحقق من رمز TOTP أولاً
    const isValidTOTP = this.verifyTOTP(token, twoFactorAuth.secret);

    if (isValidTOTP) {
      twoFactorAuth.lastUsed = new Date();
      await twoFactorAuth.save();
      return { valid: true };
    }

    // إذا لم يكن رمز TOTP صحيح، جرب رموز الاحتياط
    const isValidBackup = await this.verifyBackupCode(token, twoFactorAuth.backupCodes);

    if (isValidBackup) {
      // إزالة الرمز المستخدم من قائمة الرموز الاحتياطية
      const updatedBackupCodes = twoFactorAuth.backupCodes.filter(async (code) => {
        return !(await this.verifyBackupCode(token, [code]));
      });

      twoFactorAuth.backupCodes = updatedBackupCodes;
      twoFactorAuth.lastUsed = new Date();
      await twoFactorAuth.save();

      return { valid: true, usedBackupCode: true };
    }

    return { valid: false };
  }

  /**
   * جلب حالة 2FA للمستخدم
   */
  static async getTwoFactorStatus(userId: string): Promise<{
    isEnabled: boolean;
    backupCodesCount: number;
    lastUsed?: Date;
  }> {
    const twoFactorAuth = await TwoFactorAuth.findOne({ userId });

    if (!twoFactorAuth) {
      return { isEnabled: false, backupCodesCount: 0 };
    }

    return {
      isEnabled: twoFactorAuth.isEnabled,
      backupCodesCount: twoFactorAuth.backupCodes.length,
      lastUsed: twoFactorAuth.lastUsed
    };
  }

  /**
   * إعادة إنشاء رموز احتياطية
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const twoFactorAuth = await TwoFactorAuth.findOne({ userId });

    if (!twoFactorAuth) {
      throw new Error('التحقق بخطوتين غير مفعل لهذا المستخدم');
    }

    const newBackupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await this.hashBackupCodes(newBackupCodes);

    twoFactorAuth.backupCodes = hashedBackupCodes;
    await twoFactorAuth.save();

    return newBackupCodes;
  }

  /**
   * البحث عن الحسابات الافتراضية وتحديثها
   */
  static async cleanupDefaultAccounts(): Promise<{
    accountsFound: number;
    passwordsUpdated: number;
    accountsDisabled: number;
  }> {
    const results = {
      accountsFound: 0,
      passwordsUpdated: 0,
      accountsDisabled: 0
    };

    try {
      // البحث عن حسابات إدارية افتراضية محتملة
      const defaultAccounts = await AdminUser.find({
        $or: [
          { username: { $in: ['admin', 'administrator', 'root', 'superadmin'] } },
          { password: { $in: ['admin', 'password', '123456', 'admin123'] } }
        ]
      });

      results.accountsFound = defaultAccounts.length;

      for (const account of defaultAccounts) {
        try {
          // تعطيل الحساب إذا كان افتراضياً واضحاً
          if (['admin', 'administrator', 'root'].includes(account.username.toLowerCase())) {
            account.isActive = false;
            await account.save();
            results.accountsDisabled++;
            console.log(`Disabled default admin account: ${account.username}`);
          } else {
            // تحديث كلمة المرور للحسابات الأخرى
            const newPassword = this.generateSecurePassword();
            account.password = await this.hashPassword(newPassword);
            await account.save();
            results.passwordsUpdated++;
            console.log(`Updated password for account: ${account.username}`);
          }
        } catch (error) {
          console.error(`Error processing default account ${account.username}:`, error);
        }
      }

      return results;

    } catch (error) {
      console.error('Error cleaning up default accounts:', error);
      throw error;
    }
  }

  /**
   * إنشاء كلمة مرور آمنة عشوائياً
   */
  static generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + symbols;

    let password = '';

    // ضمان وجود حرف من كل نوع
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // إضافة أحرف عشوائية للوصول للطول المطلوب
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // خلط الكلمات لتجنب النمط الواضح
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}
