// permissions.ts

import { UserDocument } from "../models/user";

type Context = "superadmin" |"admin" | "userApp" | "driverApp";

export const getUserCapabilities = (user: UserDocument, context: Context) => {
  const isAdminContext = context === "admin";
  const isDriverApp = context === "driverApp";
  const isUserApp = context === "userApp";

  return {
    // 🔒 صلاحيات إدارية
    canAccessAdminPanel: (user.role === "admin" || user.role === "superadmin") && isAdminContext,
    canManageUsers: user.role === "superadmin" && isAdminContext,
   canViewStats:
      (user.role === "admin" || user.role === "superadmin") &&
      isAdminContext,
    // 🚚 صلاحيات السائق
    canDeliver: user.isDriver && user.isAvailableForDelivery && isDriverApp,
    canAccessDriverApp: user.isDriver && isDriverApp,

    // 💼 صلاحيات العمل الحر
    canFreelance: user.isFreelancer && !!user.freelancerProfile?.service && isUserApp,

    // 👤 صلاحيات المستخدم العام
    canAccessUserApp: user.role === "user" && isUserApp,

    // 🔄 إدارة الطلبات - مثلاً للمشرفين
    canManageOrders: (user.role === "admin" || user.role === "superadmin") && isAdminContext,
  };
};

export type Capabilities = ReturnType<typeof getUserCapabilities>;
