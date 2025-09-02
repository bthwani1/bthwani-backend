// src/middleware/verifyCapability.ts
import { Request, Response, NextFunction } from "express";
import { getUserCapabilities } from "../utils/permissions";
import { User } from "../models/user";

export const verifyCapability = (
  context: "superadmin" | "admin" | "userApp" | "driverApp",
  capability: keyof ReturnType<typeof getUserCapabilities>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // ١. خذ UID من req.user.uid (محشوّ بواسطة verifyFirebase)
      const firebaseUID = (req.user as any)?.uid;
      if (!firebaseUID) {
         res.status(401).json({ message: "Unauthorized" });
         return;
      }

      // ٢. جلب المستخدم من الداتا بيز
      const user = await User.findOne({ firebaseUID });
      if (!user) {
         res.status(401).json({ message: "User not found" });
         return;
      }

      // ٣. احسب قدراته
      const capabilities = getUserCapabilities(user, context);
      if (!capabilities[capability]) {
         res.status(403).json({ message: "Insufficient permissions" });
         return;
      }

      // ٤. لا تكتب على req.user! لكن احفظ الـ User doc في حقل آخر
      (req as any).userData = user;
      next();
    } catch (error) {
      console.error("verifyCapability error:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };
};
