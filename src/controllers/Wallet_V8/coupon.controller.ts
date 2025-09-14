import { Request, Response } from "express";
import { Coupon } from "../../models/Wallet_V8/coupon.model";
import { User } from "../../models/user";

// 🎫 إنشاء كوبون
export const createCoupon = async (req: Request, res: Response) => {
  const { code, type, value, expiryDate, assignedTo, usageLimit } = req.body;

  const exists = await Coupon.findOne({ code });
  if (exists) {
    res.status(400).json({ error: "الكود مستخدم مسبقًا" });
    return;
  }

  const coupon = new Coupon({
    code,
    type,
    value,
    expiryDate,
    assignedTo,
    usageLimit,
  });
  await coupon.save();
  res.json({ success: true, coupon });
};

// ✅ التحقق من كوبون
export const validateCoupon = async (req: Request, res: Response) => {
  const { code } = req.body;
  const currentUserId = req.user!.id; // 👈 من التوكين

  const coupon = await Coupon.findOne({ code });
  if (!coupon) {
    res.status(404).json({ error: "الكوبون غير موجود" });
    return;
  }
  if (coupon.expiryDate < new Date()) {
    res.status(400).json({ error: "انتهت صلاحية الكوبون" });
    return;
  }
  if (coupon.assignedTo && String(coupon.assignedTo) !== currentUserId) {
    res.status(403).json({ error: "غير مخصص لك" });
    return;
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    res.status(400).json({ error: "تم استخدام الكوبون بالكامل" });
    return;
  }

  res.json({ success: true, coupon });
};

// ✔️ تسجيل استخدام الكوبون
export const markCouponAsUsed = async (req: Request, res: Response) => {
  const { code } = req.body;
  const currentUserId = req.user!.id; // 👈 من التوكين
  const coupon = await Coupon.findOne({ code });
  if (!coupon) {
    res.status(404).json({ error: "الكوبون غير موجود" });

    return;
  }
  if (coupon.assignedTo && String(coupon.assignedTo) !== currentUserId) {
    res.status(403).json({ error: "غير مخصص لك" });
    return;
  }
  coupon.usedCount += 1;
  if (coupon.usedCount >= (coupon.usageLimit || 1)) {
    coupon.isUsed = true;
  }
  await coupon.save();

  res.json({ success: true });
};

export const redeemPoints = async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  const REQUIRED_POINTS = 100;
  const COUPON_VALUE = 100;

  if (user.wallet.loyaltyPoints < REQUIRED_POINTS) {
    res.status(400).json({ error: "نقاطك غير كافية" });

    return;
  }

  const code = `PTS${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const coupon = new Coupon({
    code,
    type: "fixed",
    value: COUPON_VALUE,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    assignedTo: user._id,
    usageLimit: 1,
  });

  user.wallet.loyaltyPoints -= REQUIRED_POINTS;
  await coupon.save();
  await user.save();

  res.json({ success: true, coupon });
};
