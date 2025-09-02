import { UserDocument } from "../models/user";

type Context = "admin" | "userApp" | "driverApp";

export const getUserCapabilities = (user: UserDocument, context: Context) => {
  const isAdminContext = context === "admin";
  const isDriverApp = context === "driverApp";

  return {
    canAccessAdminPanel: user.role === "admin" || user.role === "superadmin",
    canManageUsers: user.role === "superadmin",

    canDeliver: user.isDriver && user.isAvailableForDelivery,
    canFreelance: user.isFreelancer && !!user.freelancerProfile?.service,

    canAccessDriverApp: user.isDriver && isDriverApp,
    canAccessUserApp: user.role === "user" && context === "userApp",

    canManageOrders: user.role === "admin" || user.role === "superadmin",
    canViewStats: isAdminContext && user.role === "admin",
  };
};

export type Capabilities = ReturnType<typeof getUserCapabilities>;