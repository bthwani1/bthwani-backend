// middleware/verifyVendorJWT.ts
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: { vendorId: string; role?: string };
    }
  }
}

export function verifyVendorJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }
  const token = header.split(" ")[1];

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
