import { Schema, model, Document } from "mongoose";
import bcrypt from 'bcryptjs';


// 1. Enum لأسماء الأقسام (Modules)
export enum ModuleName {
  Admin = "admin", // ← أضفناه هنا
  DELIVERY = "delivery",
  HR = "hr",
  FINANCE = "finance",
  OFFERS = "offers",
  STORES = "stores",
  Users='users',
  Oreders='orders',
  Products='products',
  Notification='notification',
  Quailty='quailty',

  // أضف أي قسم جديد هنا
}

// 2. Enum للأدوار
export enum AdminRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  MANAGER = "manager",
  OPERATOR = "operator",
  VENDOR="vendor",
}

// 3. واجهة PermissionsSet
export interface ModulePermissions {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  approve?: boolean;
  export?: boolean;
  // أضف أي صلاحيات أخرى هنا...
}
export interface AdminUserDocument extends Document {
  username: string;
  password: string;
  roles: AdminRole[];
  // هنا نحدد أن المفتاح يجب أن يكون من ModuleName
  permissions: Partial<Record<ModuleName, ModulePermissions>>;
  isActive: boolean;
  lastLogin?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

// 4. تعريف السكيمة
const AdminUserSchema = new Schema<AdminUserDocument>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: {
      type: [String],
      enum: Object.values(AdminRole),
      default: [AdminRole.ADMIN],
      required: true,
    },
    permissions: {
      type: Map,
      of: new Schema(
        {
          view: { type: Boolean, default: false },
          create: { type: Boolean, default: false },
          edit: { type: Boolean, default: false },
          delete: { type: Boolean, default: false },
          approve: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: {},
      // 5. نضيف فالح للتحقق من صلاحية المفتاح ليكون من ModuleName
      validate: {
        validator: function (map: Map<string, ModulePermissions>) {
          return Array.from(map.keys()).every((key) =>
            Object.values(ModuleName).includes(key as ModuleName)
          );
        },
        message: "Invalid module name in permissions",
      },
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// 6. Hash password
AdminUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
AdminUserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const AdminUser = model<AdminUserDocument>("AdminUser", AdminUserSchema);
