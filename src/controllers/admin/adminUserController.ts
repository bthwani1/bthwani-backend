import { Request, Response } from "express";
import { User } from "../../models/user";
import {
  AdminUser,
  AdminRole,

} from "../../models/admin/AdminUser";
import { parseListQuery } from "../../utils/query";

// ✅ عرض كل المستخدمين
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page, perPage, q, sort, filters } = parseListQuery(req.query);

    const filter: any = {};
    if (filters?.role) filter.role = filters.role;
    if (typeof req.query.isVerified !== "undefined") filter.isVerified = req.query.isVerified === "true";
    if (typeof req.query.isBanned !== "undefined") filter.isBanned = req.query.isBanned === "true";
    if (q) filter.$or = [{ fullName: new RegExp(q, "i") }, { phone: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-security -wallet -activityLog")
      .sort(sort ?? { createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    res.json({
      users,
      pagination: {
        page,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage),
      },
      items: users,
      meta: { page, per_page: perPage, total, returned: users.length },
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err });
  }
};

// ✅ عرض مستخدم بالتفصيل
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err });
  }
};

// ✅ تعديل صلاحيات مستخدم أو حظره
export const updateUserAdmin = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { role, isBanned, isVerified } = req.body;
    if (role) user.role = role;
    if (typeof isBanned === "boolean") user.isBanned = isBanned;
    if (typeof isVerified === "boolean") user.isVerified = isVerified;

    await user.save();
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating user", error: err });
  }
};
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const total = await User.countDocuments();
    const admins = await User.countDocuments({ role: "admin" });
    const superads = await User.countDocuments({ role: "superadmin" });
    const users = await User.countDocuments({ role: "user" });
    const active = await User.countDocuments({ isBlocked: false });
    const blocked = await User.countDocuments({ isBlocked: true });

    res.json({
      total,
      admins: admins + superads,
      users,
      active,
      blocked,
      lastUpdated: new Date(),
    });
  } catch (err) {
    console.error("getAdminStats error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  user.role = role;
  await user.save();
  res.json({ message: "Role updated successfully" });
};

export const createAdminUser = async (req: any, res: any) => {
  try {
    const { username, password, roles, permissions } = req.body;

    // تأكد من أن roles مصفوفة، وإلا اجعلها ADMIN افتراضيًا
    const userRoles =
      Array.isArray(roles) && roles.length > 0 ? roles : [AdminRole.ADMIN];

    // تأكد من أن permissions كائن Map أو Object
    const user = new AdminUser({
      username,
      password,
      roles: userRoles,
      permissions: permissions || {},
    });

    await user.save();
    res.status(201).json({ message: "Admin user created", user });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error creating admin user", error: err.message });
  }
};
export const updateAdminUser = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { username, password, roles, permissions } = req.body;

    const user = await AdminUser.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    if (username) user.username = username;
    if (password) user.password = password;
    if (roles) user.roles = roles;
    if (permissions) user.permissions = permissions;

    await user.save();
    res.json({ message: "Admin user updated", user });
  } catch (err: any) {
    res.status(500).json({ message: "Error updating admin user", error: err.message });
  }
};
// export const loginDriver = async (req: Request, res: Response) => {
//   const { phone, password } = req.body;
//   try {
//     const driver = await User.findOne({ phone });
//     if (!driver) return res.status(400).json({ message: 'رقم الهاتف غير مسجل' });

//     const isMatch = await driver.comparePassword(password);
//     if (!isMatch) return res.status(400).json({ message: 'كلمة المرور غير صحيحة' });

//     const token = jwt.sign({ id: driver._id }, process.env.JWT_SECRET || 'secret123', {
//       expiresIn: '7d'
//     });

//     res.json({ token, driver });
//   } catch (err: any) {
//     res.status(500).json({ message: err.message });
//   }
// };
