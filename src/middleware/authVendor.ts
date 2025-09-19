// src/middleware/authVendor.ts
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: { vendorId: string; role?: string };
    }
  }
}

export function authVendor(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const token = header.slice(7);
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // ادعم كل الاحتمالات: vendorId (الموصى به) أو id أو _id
    const vendorId = decoded.vendorId || decoded.id || decoded._id;
    if (!vendorId) {
      res
        .status(401)
        .json({ message: "Invalid token payload (vendorId missing)" });
      return;
    }

    req.user = { vendorId: String(vendorId), role: decoded.role };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
