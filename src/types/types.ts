import { AdminRole, ModulePermissions } from '../models/admin/AdminUser';

export interface AdminPayload {
  id: string;
  uid: string;
  role: AdminRole;
  date?: Date;
  email: string;
  roles?: AdminRole[]; // ← اجعلها اختيارية
  permissions?: ModulePermissions; // ← اجعلها اختيارية
  iat?: number;
  exp?: number;
}
