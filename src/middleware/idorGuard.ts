// src/middleware/idorGuard.ts
import { Request, Response, NextFunction } from "express";

export const guardSensitive = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Add any sensitive data protection logic here
  // For now, just pass through
  next();
};

export const sanitizeOutput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Add output sanitization logic here
  // For now, just pass through
  next();
};
