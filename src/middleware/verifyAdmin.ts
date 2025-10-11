// middleware/verifyAdmin.ts
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user";
import { ERR } from "../utils/errors";

export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const decoded = (req as any).firebaseUser || (req as any).user; // يدعمان الحالتين
    const firebaseUID = decoded?.uid;
    const email = decoded?.email;
    console.log(
      "verifyAdmin decoded uid/email:",
      (req as any).firebaseUser?.uid,
      (req as any).firebaseUser?.email
    );
    const found = await User.findOne({
      $or: [
        { firebaseUID: (req as any).firebaseUser?.uid },
        { uid: (req as any).firebaseUser?.uid },
        { email: (req as any).firebaseUser?.email },
      ],
    }).lean();
    console.log(
      "verifyAdmin user doc:",
      found && {
        id: found._id,
        role: found.role,
        firebaseUID: found.firebaseUID,
      }
    );

    if (!firebaseUID) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
      return;
    }

    const user = await User.findOne({
      $or: [
        { firebaseUID: firebaseUID },
        { uid: firebaseUID }, // لو كان الحقل باسم مختلف
        { email: email }, // احتياط على البريد
      ],
    }).lean();

    if (!user || !["admin", "superadmin"].includes(user.role)) {
      res.status(403).json({ error: { code: "ADMIN_REQUIRED", message: "Admin access required" } });
      return;
    }

    (req as any).userData = user;
    next();
  } catch (err) {
    console.error("verifyAdmin error:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Error verifying admin" } });
    return;
  }
};
