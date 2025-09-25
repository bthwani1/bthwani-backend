// src/controllers/marketing/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Marketer from "../../models/fieldMarketingV1/Marketer";
import mongoose, { now } from "mongoose";
import AccountDeletionRequest from "../../models/security/AccountDeletionRequest";

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
    if (!payload?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const mk = await Marketer.findById(payload.id).select("-password").lean();
    if (!mk) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.json(mk);
    return;
  } catch (e: any) {
    res.status(500).json({ message: e.message });
    console.error("me error:", e);
    return;
  }
};
export async function requestAccountDeletion(req: Request, res: Response) {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { reason, contact } = req.body || {};

    // upsert طلب الحذف ليكون idempotent
    const doc = await AccountDeletionRequest.findOneAndUpdate(
      { marketerId: userId, status: { $in: ["pending", "received"] } },
      {
        $setOnInsert: {
          marketerId: userId,
          status: "pending",
          createdAt: now(),
        },
        $set: {
          updatedAt: now(),
          reason: reason || null,
          contact: contact || null,
        },
      },
      { upsert: true, new: true }
    ).lean();

    // علّم حساب المسوّق بأنه لديه طلب حذف (اختياري)
    await Marketer.updateOne(
      { _id: userId },
      { $set: { deletionRequestedAt: now() } }
    );

    res.json({
      ok: true,
      message: "تم استلام طلب حذف الحساب. سنعالج الطلب وفق السياسة.",
      requestId: doc?._id,
      status: doc?.status || "pending",
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "Server error" });
    return;
  }
}

/**
 * حذف فوري ذاتي (Soft delete) — يُخفي البيانات الحساسة ويعلّم الحساب كمحذوف.
 * NOTE: لو أردت حذفًا صارمًا لجميع العلاقات، نفّذ جوب خلفية للترحيل/الإخفاء في بقية الجداول.
 */
export async function deleteMyAccountSoft(req: Request, res: Response) {
  const session = await mongoose.startSession();
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await session.withTransaction(async () => {
      // اجلب الحساب
      const m = await Marketer.findById(userId).session(session);
      if (!m) {
        res.status(404).json({ message: "الحساب غير موجود" });
        return;
      }

      // أخفِ PII + علِّم كمحذوف
      m.fullName = "Deleted User";
      m.phone = `deleted:${m._id}`;
      m.email = undefined as any;
      (m as any).deletedAt = now();
      m.status = "suspended"; // أو "deleted" لو أضفتها في enum
      await m.save({ session });

      // علّم أي طلب حذف نشط بأنه "confirmed"
      await AccountDeletionRequest.updateMany(
        { marketerId: userId, status: { $in: ["pending", "received"] } },
        { $set: { status: "confirmed", updatedAt: now() } },
        { session }
      );

      // TODO (اختياري جداً): أخف/انسب/انقل الملكية في جداول أخرى:
      // - DeliveryStore: إزالة/تفريغ createdByMarketerId / createdByMarketerUid
      // - Vendor: إزالة createdByMarketerId
      // - Push tokens: إلغاؤها إن وُجدت
      // - Logs/Analytics: إبقاءها بدون PII

    });

    res.json({
      ok: true,
      message: "تم حذف الحساب (إخفاء البيانات الحساسة) حسب السياسة.",
    });
  } catch (e: any) {
    if (!res.headersSent) {
      res.status(500).json({ message: e.message || "Server error" });
      return;
    }
  } finally {
    session.endSession();
  }
}