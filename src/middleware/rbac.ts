// src/middleware/rbac.ts
import { Request, Response, NextFunction } from "express";

export const requireRole = (requiredRole: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const userRole = req.user.role;
    if (!userRole) {
      res.status(403).json({ message: "Role not assigned" });
      return;
    }

    // Check if user has the required role or is admin
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (userRole === "admin" || roles.includes(userRole)) {
      next();
      return;
    }

    res.status(403).json({ message: "Insufficient permissions" });
  };
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return requireRole("admin")(req, res, next);
};
