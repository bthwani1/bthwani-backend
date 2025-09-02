// ==============================
// src/controllers/adminController.ts
// ==============================
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AdminUser, AdminRole, ModuleName, ModulePermissions } from '../../models/admin/AdminUser';

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
    const admin = await AdminUser.findOne({ username });
    if (!admin) {
res.status(401).json({ message: 'Invalid credentials' });
        return;
    } 

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
res.status(401).json({ message: 'Invalid credentials' });
        return;
    } 

    const token = jwt.sign(
      { id: admin._id, roles: admin.roles, permissions: admin.permissions },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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
        return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
