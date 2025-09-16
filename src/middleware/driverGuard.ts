// src/middleware/driverGuard.ts
import { Request, Response, NextFunction } from "express";

export const verifyDriver = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const userRole = req.user.role;
  if (userRole !== "driver") {
    res.status(403).json({ message: "Driver access required" });
    return;
  }

  next();
};

export const requireDriverSelf = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const userRole = req.user.role;
  if (userRole !== "driver") {
    res.status(403).json({ message: "Driver access required" });
    return;
  }

  // Check if the driver is accessing their own data
  const driverId = req.params.id || req.params.driverId;
  if (driverId && req.user.id !== driverId) {
    res
      .status(403)
      .json({ message: "Access denied: Can only access your own data" });
    return;
  }

  next();
};
