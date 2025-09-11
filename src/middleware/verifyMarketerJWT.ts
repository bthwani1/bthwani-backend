import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface MarketerJwtPayload {
  id: string;
  role: "marketer";
  // optionally:
  uid?: string;
}

export const verifyMarketerJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = (req.headers.authorization || "") as string;
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      res.status(401).json({ message: "Missing token" });
      return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    // normalized user object
    (req as any).user = {
      id: decoded?.id || decoded?.uid,
      uid: decoded?.uid || decoded?.id,
      role: decoded?.role,
      ...decoded,
    };
    next();
  } catch (e: any) {
    res.status(401).json({ message: "Invalid token" });
  }
};
