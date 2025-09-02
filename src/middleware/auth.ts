import { Request, Response, NextFunction } from "express";

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "صلاحية غير كافية" });
      return;
    }
    next();
  };
};
