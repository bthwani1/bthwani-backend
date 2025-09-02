import { Request, Response, NextFunction } from "express";
import { User } from "../models/user";

export const logLogin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.uid) {
    return next();
  }

  try {
    const ip = req.ip || "unknown"; // ✅ معالجة ip
    const userAgent = req.headers["user-agent"] || "unknown"; // ✅ معالجة user-agent

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (user) {
      user.loginHistory.push({ ip, userAgent, at: new Date() });
      await user.save();
    }
  } catch (err) {
    console.error("Error logging login:", err);
  }

  next();
};
