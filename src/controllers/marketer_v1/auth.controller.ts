// src/controllers/marketing/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Marketer from "../../models/fieldMarketingV1/Marketer";

export const marketerLogin = async (req: Request, res: Response) => {
  try {
    console.log(">>> INCOMING marketer-login body:", req.body);
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      console.log("marketer-login: missing fields");
      res.status(400).json({ message: "email أو phone + password مطلوبة" });
      return;
    }

    const query: any = email
      ? { email: (email as string).toLowerCase() }
      : { phone };
    const marketer = await Marketer.findOne(query);
    console.log(
      "marketer-login: marketer found:",
      marketer ? { id: marketer._id, email: marketer.email } : null
    );

    if (!marketer) {
      console.log("marketer-login: marketer not found");
      res.status(400).json({ message: "بيانات الدخول غير صحيحة" });
      return;
    }

    if (marketer.status !== "active") {
      console.log("marketer-login: account not active", marketer.status);
      res.status(403).json({ message: "الحساب موقوف مؤقتًا" });
      return;
    }

    const ok = await bcrypt.compare(password, marketer.password);
    console.log("marketer-login: bcrypt compare result:", ok);

    if (!ok) {
      res.status(400).json({ message: "بيانات الدخول غير صحيحة" });
      return;
    }

    const token = jwt.sign(
      { id: marketer._id, role: "marketer" },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "7d" }
    );

    const user = {
      _id: marketer._id,
      fullName: marketer.fullName,
      phone: marketer.phone,
      email: marketer.email,
      city: marketer.city,
      team: marketer.team,
      area: marketer.area,
      status: marketer.status,
      createdAt: marketer.createdAt,
    };

    console.log("marketer-login: success -> sending token");
    res.json({ token, user });
    return;
  } catch (e: any) {
    console.error("marketer-login error:", e);
    res.status(500).json({ message: e.message || "Server error" });
    return;
  }
};
export const me = async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user; // وضعته في verifyMarketerJWT
    if (!payload?.id) res.status(401).json({ message: "Unauthorized" });
    const mk = await Marketer.findById(payload.id).select("-password").lean();
    if (!mk) res.status(404).json({ message: "Not found" });
    res.json(mk);
    return;
  } catch (e: any) {
    res.status(500).json({ message: e.message });
    return;
  }
};
