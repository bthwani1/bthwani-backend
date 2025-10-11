// src/middleware/rbac.ts
import { Request, Response, NextFunction } from "express";

export interface UserPermissions {
  [module: string]: {
    [action: string]: boolean;
  };
}

export interface AuthenticatedUser {
  uid: string;
  role?: string;
  permissions?: UserPermissions;
}

// Enhanced role-based access control
export const requireRole = (requiredRole: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required" }
      });
      return;
    }

    const user = req.user as AuthenticatedUser;
    const userRole = user.role;

    if (!userRole) {
      res.status(403).json({
        error: { code: "ROLE_NOT_ASSIGNED", message: "User role not assigned" }
      });
      return;
    }

    // Check if user has the required role or is superadmin
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (userRole === "superadmin" || userRole === "admin" || roles.includes(userRole)) {
      next();
      return;
    }

    res.status(403).json({
      error: { code: "INSUFFICIENT_ROLE", message: "Insufficient role permissions" }
    });
  };
};

// Granular permission-based access control
export const requirePermission = (module: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required" }
      });
      return;
    }

    const user = req.user as AuthenticatedUser;
    const userPermissions = user.permissions || {};

    // Superadmin has all permissions
    if (user.role === "superadmin") {
      next();
      return;
    }

    // Check specific permission
    if (userPermissions[module]?.[action] === true) {
      next();
      return;
    }

    res.status(403).json({
      error: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: `Permission required: ${module}:${action}`
      }
    });
  };
};

// Combined role and permission check
export const requireRoleOrPermission = (
  roles: string | string[],
  module?: string,
  action?: string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required" }
      });
      return;
    }

    const user = req.user as AuthenticatedUser;
    const userRole = user.role;
    const userPermissions = user.permissions || {};

    // Superadmin bypasses all checks
    if (userRole === "superadmin") {
      next();
      return;
    }

    // Check role first
    const roleArray = Array.isArray(roles) ? roles : [roles];
    if (userRole && roleArray.includes(userRole)) {
      next();
      return;
    }

    // If specific permission is required, check it
    if (module && action && userPermissions[module]?.[action] === true) {
      next();
      return;
    }

    res.status(403).json({
      error: { code: "ACCESS_DENIED", message: "Access denied" }
    });
  };
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return requireRole(["admin", "superadmin"])(req, res, next);
};
