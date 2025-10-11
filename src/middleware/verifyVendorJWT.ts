// middleware/verifyVendorJWT.ts
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        vendorId?: string;
        role?: string;
        id?: string;
        uid?: string;
        email?: string;
      };
    }
  }
}

export function verifyVendorJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header) {
    res.status(401).json({ message: "No authorization header provided" });
    return;
  }

  if (!header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Invalid authorization format - expected Bearer token" });
    return;
  }

  const token = header.split(" ")[1]?.trim();

  if (!token || token.length < 10) {
    res.status(401).json({ message: "Invalid token format - token too short" });
    return;
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const vendorId = decoded.vendorId || decoded.id || decoded._id; // دعم صيغ قديمة

    if (!vendorId) {
      res
        .status(401)
        .json({ message: "Invalid token payload (vendorId missing)" });
      return;
    }

    req.user = { vendorId, role: decoded.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}
