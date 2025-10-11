// ==============================
// src/controllers/adminController.ts
// ==============================
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AdminUser, AdminRole, ModuleName, ModulePermissions } from '../../models/admin/AdminUser';
import { recordFailedAttempt, resetFailedAttempts } from '../../middleware/bruteForceProtection';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const TOKEN_EXPIRY = '1d'; // مدة صلاحية التوكن

// تسجيل مدير جديد: تحقق من roles و permissions
export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password, roles, permissions } = req.body;
    // تصفية الأدوار
    const validRoles = Array.isArray(roles)
      ? roles.filter((r: string) => Object.values(AdminRole).includes(r as AdminRole))
      : [];
    // تصفية الصلاحيات حسب ModuleName
    const validPerms: Partial<Record<ModuleName, ModulePermissions>> = {};
    if (permissions && typeof permissions === 'object') {
      for (const key of Object.keys(permissions)) {
        if (Object.values(ModuleName).includes(key as ModuleName)) {
          validPerms[key as ModuleName] = permissions[key];
        }
      }
    }

    const exists = await AdminUser.findOne({ username });
    if (exists) {
res.status(400).json({ message: 'Username taken' });
        return;
    } 

    const admin = new AdminUser({
      username,
      password,
      roles: validRoles.length ? validRoles : [AdminRole.ADMIN],
      permissions: validPerms,
    });
    await admin.save();
    res.status(201).json({ message: 'Admin created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// تسجيل الدخول للمدير: تحقق من البيانات وارجاع JWT
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // البحث عن المستخدم
    const admin = await AdminUser.findOne({ username });
    if (!admin) {
      // تسجيل محاولة فاشلة
      await recordFailedAttempt(req);
       res.status(401).json({
        message: 'بيانات الدخول غير صحيحة',
        error: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // التحقق من كلمة المرور
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      // تسجيل محاولة فاشلة
      await recordFailedAttempt(req);
       res.status(401).json({
        message: 'بيانات الدخول غير صحيحة',
        error: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // التحقق من حالة الحساب
    if (!admin.isActive) {
       res.status(401).json({
        message: 'الحساب معطل، يرجى التواصل مع مدير النظام',
        error: 'ACCOUNT_DISABLED'
      });
      return;
    }

    // تسجيل دخول ناجح - إعادة تعيين محاولات الفشل
    await resetFailedAttempts(req);

    // إنشاء التوكن
    const token = jwt.sign(
      { id: admin._id, roles: admin.roles, permissions: admin.permissions },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({
      token,
      user: {
        id: admin._id,
        username: admin.username,
        roles: admin.roles,
        permissions: admin.permissions
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

// جلب جميع المدراء (مع استثناء الباسورد)
export const getAdmins = async (_req: Request, res: Response) => {
  try {
    const admins = await AdminUser.find().select('-password');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// تحديث الصلاحيات لمدير موجود
export const updatePermissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // تصفية الصلاحيات حسب ModuleName
    const validPerms: Partial<Record<ModuleName, ModulePermissions>> = {};
    if (permissions && typeof permissions === 'object') {
      for (const key of Object.keys(permissions)) {
        if (Object.values(ModuleName).includes(key as ModuleName)) {
          validPerms[key as ModuleName] = permissions[key];
        }
      }
    }

    const updated = await AdminUser.findByIdAndUpdate(
      id,
      { permissions: validPerms },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) {
      res.status(404).json({ message: 'Admin not found' });
      return
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// جلب مسؤول واحد بالـ ID
export const getAdminById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = await AdminUser.findById(id).select('-password');

    if (!admin) {
      res.status(404).json({ message: 'Admin not found' });
      return
    }

    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// حذف مسؤول
export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // منع حذف آخر SuperAdmin
    const admin = await AdminUser.findById(id);
    if (!admin) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }

    if (admin.roles.includes(AdminRole.SUPERADMIN)) {
      const superAdminCount = await AdminUser.countDocuments({
        roles: AdminRole.SUPERADMIN,
        _id: { $ne: id }
      });

      if (superAdminCount === 0) {
        res.status(400).json({ message: 'Cannot delete last SuperAdmin' });
        return;
      }
    }

    await AdminUser.findByIdAndDelete(id);
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// تحديث حالة المسؤول (تفعيل/تعطيل)
export const updateAdminStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      res.status(400).json({ message: 'isActive must be boolean' });
      return;
    }

    const admin = await AdminUser.findById(id);
    if (!admin) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }

    // منع تعطيل آخر SuperAdmin
    if (!isActive && admin.roles.includes(AdminRole.SUPERADMIN)) {
      const activeSuperAdminCount = await AdminUser.countDocuments({
        roles: AdminRole.SUPERADMIN,
        isActive: true,
        _id: { $ne: id }
      });

      if (activeSuperAdminCount === 0) {
        res.status(400).json({ message: 'Cannot deactivate last active SuperAdmin' });
        return;
      }
    }

    const updated = await AdminUser.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// تحديث مسؤول كامل
export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, roles, permissions, isActive } = req.body;

    // تصفية الأدوار
    const validRoles = Array.isArray(roles)
      ? roles.filter((r: string) => Object.values(AdminRole).includes(r as AdminRole))
      : undefined;

    // تصفية الصلاحيات
    const validPerms: Partial<Record<ModuleName, ModulePermissions>> = {};
    if (permissions && typeof permissions === 'object') {
      for (const key of Object.keys(permissions)) {
        if (Object.values(ModuleName).includes(key as ModuleName)) {
          validPerms[key as ModuleName] = permissions[key];
        }
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.username = name;
    if (email !== undefined) updateData.username = email; // استخدام email كـ username مؤقتاً
    if (validRoles !== undefined) updateData.roles = validRoles;
    if (Object.keys(validPerms).length > 0) updateData.permissions = validPerms;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await AdminUser.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
