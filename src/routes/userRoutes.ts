// src/routes/userRoutes.ts

import { Router } from "express";
import { verifyFirebase } from "../middleware/verifyFirebase";
import {
  registerOrUpdateUser,
  getCurrentUser,
  updateProfile,
  updateSecurity,
  setPinCode,
  verifyPinCode,
  getUserStats,
  deactivateAccount,
  getAddresses,
  searchUsers,
  deleteMyAccount,
  getDeleteEligibility,
} from "../controllers/user/userController";
import {
  addAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from "../controllers/user/addressController";
import {
  getTransactions,
  getTransferHistory,
  getWallet,
  transferFunds,
} from "../controllers/Wallet_V8/walletController";

import {
  getNotifications,
  markAllNotificationsRead,
} from "../controllers/user/notificationsController";
import { uploadAvatar } from "../controllers/user/userAvatarController";
import { sendEmailOTP, verifyOTP } from "../controllers/otpControllers";
import { User } from "../models/user";
import { OTP } from "../models/otp";
import { Types } from "mongoose";
import { sendOTPByChannel } from "../utils/otpAll";

const router = Router();

router.get(
  "/me",
  (req, res, next) => {
    console.log("[/users/me] before verify");
    next();
  },
  verifyFirebase,
  (req, res, next) => {
    console.log("[/users/me] after verify");
    next();
  },

  getCurrentUser
);
router.get(
  "/search",
  verifyFirebase, // ← هذا يحلّل الـ JWT ويضع req.user
  searchUsers
);
router.post("/init", verifyFirebase, registerOrUpdateUser);

router.patch("/profile", verifyFirebase, updateProfile);

router.patch("/security", verifyFirebase, updateSecurity);

router.patch("/security/set-pin", verifyFirebase, setPinCode);

router.patch("/security/verify-pin", verifyFirebase, verifyPinCode);

router.get("/me/stats", verifyFirebase, getUserStats);

router.delete("/me/deactivate", verifyFirebase, deactivateAccount);

router.get("/me/delete-eligibility", verifyFirebase, getDeleteEligibility);

router.delete("/me", verifyFirebase, deleteMyAccount);

router.get("/address", verifyFirebase, getAddresses);

router.post("/address", verifyFirebase, addAddress);

router.patch("/address/:id", verifyFirebase, updateAddress);

router.delete("/address/:id", verifyFirebase, deleteAddress);

router.patch("/default-address", verifyFirebase, setDefaultAddress);

router.get("/wallet", verifyFirebase, getWallet);

router.get("/transactions", verifyFirebase, getTransactions);

router.post("/wallet/transfer", verifyFirebase, transferFunds);

router.get("/wallet/transfer-history", verifyFirebase, getTransferHistory);

router.get("/notifications", verifyFirebase, getNotifications);

router.patch(
  "/notifications/mark-read",
  verifyFirebase,
  markAllNotificationsRead
);
router.patch("/avatar", verifyFirebase, uploadAvatar);

router.post("/otp/send", verifyFirebase, async (req, res) => {
  try {
    const fb = (req as any).firebaseUser;
    const uid = fb?.uid;
    const email = fb?.email;
    if (!uid || !email) {
      res.status(401).json({ ok:false, message:"Unauthorized" });
      return;
    }

    const user = await User.findOne({ firebaseUID: uid }).lean();
    if (!user)    {
      res.status(404).json({ ok:false, message:"المستخدم غير موجود" });
      return;
    }

    const { channel = "email", purpose = "verifyEmail" } = req.body;
    const validChannels = ["email", "whatsapp", "sms"];
    if (!validChannels.includes(channel)) {
      res.status(400).json({ ok:false, message:"قناة غير مدعومة" });
      return;
    }

    // للـ WhatsApp/SMS نحتاج رقم الهاتف
    if ((channel === "whatsapp" || channel === "sms") && !user.phone) {
      res.status(400).json({ ok:false, message:"رقم الهاتف مطلوب لإرسال عبر الواتساب/الرسائل" });
      return;
    }

    const code = await sendEmailOTP(email, String(user._id), purpose);

    // في التطوير: أعِد الكود لمساعدة الاختبار
    const isDev = process.env.NODE_ENV !== "production";
    res.json({ ok: true, ...(isDev && { devCode: code }) });

    // إرسال حسب القناة
    const recipient = channel === "email" ? email : user.phone;
    await sendOTPByChannel(channel as "email" | "whatsapp" | "sms", recipient!, code, purpose);

  } catch (err: any) {
    console.error("❌ /users/otp/send failed:", err);
    res.status(500).json({ ok:false, message:"فشل الإرسال" });
    return;
  }
});


router.post("/otp/verify", verifyFirebase, async (req, res) => {
  try {
    const fb = (req as any).firebaseUser;
    const uid = fb?.uid;
    if (!uid)    {
      res.status(401).json({ ok:false, message:"Unauthorized" });
      return;
    }

    const { code } = req.body || {};
    if (!code || String(code).length !== 6) {
      res.status(400).json({ ok:false, code: "BAD_CODE", message: "رمز التحقق مطلوب" });
      return;
    }

    const user = await User.findOne({ firebaseUID: uid }).lean();
    if (!user) {
      res.status(404).json({ ok:false, message: "المستخدم غير موجود" });
      return;
    }

    const q = {
      userId: new Types.ObjectId(String(user._id)),
      purpose: "verifyEmail",
      code: String(code),
      used: false,
      expiresAt: { $gt: new Date() },
    };

    const otp = await OTP.findOne(q);
    if (!otp) {
      console.warn("OTP not found with query:", q);
      res.status(400).json({ ok:false, code:"BAD_OTP", message:"رمز غير صحيح أو منتهي" });
      return;
    }

    await User.updateOne({ _id: user._id }, { $set: { emailVerified: true } });
    otp.used = true;
    await otp.save();

    res.json({ ok:true, verified:true, code:"VERIFIED" });
    return;
  } catch (err: any) {
    console.error("❌ /users/otp/verify failed:", err);
    res.status(500).json({ ok:false, message:"فشل التحقق" });
    return;
  }
});


export default router;
