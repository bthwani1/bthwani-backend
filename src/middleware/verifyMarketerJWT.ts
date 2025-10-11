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

    if (!auth.startsWith("Bearer ")) {
      res.status(401).json({ message: "Invalid authorization format - expected Bearer token" });
      return;
    }

    const token = auth.slice(7)?.trim();

    if (!token || token.length < 10) {
      res.status(401).json({ message: "Invalid token format - token too short" });
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
