import { Request, Response } from "express";
import { User } from "../../models/user";
import { adminAuth } from "../../config/firebaseAdmin";
import Order from "../../models/delivery_marketplace_v1/Order";
import mongoose from "mongoose";
function isValidGeoPoint(p: any) {
  return (
    p &&
    p.type === "Point" &&
    Array.isArray(p.coordinates) &&
    p.coordinates.length === 2 &&
    typeof p.coordinates[0] === "number" &&
    typeof p.coordinates[1] === "number"
  );
}
function anonymizeUserDoc(u: any) {
  const ts = Date.now();
  u.fullName = "Deleted User";
  if (u.email) u.email = `deleted+${ts}@deleted.local`; // ضمان عدم التعارض (unique)
  u.phone = undefined;
  u.profileImage = undefined;
  u.aliasName = undefined;
  u.addresses = []; // أو امسح PII من داخلها بدل التفريغ
  (u as any).defaultAddressId = undefined;
  u.isActive = false;
  (u as any).isDeleted = true; // تأكد من وجود الحقل في الـ Schema (boolean افتراضي false)
  (u as any).metadata = { ...(u.metadata || {}), deletedAt: new Date() };
}

export const registerOrUpdateUser = async (req: Request, res: Response) => {
  const fb: any = (req as any).firebaseUser || (req as any).user;
  if (!fb?.uid) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const uid = fb.uid;
  const email = (fb.email || "").trim().toLowerCase(); // 👈 توحيد الإيميل
  const body = { ...req.body };
  const fullName = (body.fullName || "مستخدم").toString().trim();

  // لا تثق بإيميل العميل في الجسم — استخدم المصدَّق من التوكن
  delete (body as any).email;

  // نظّف الـ donationLocation
  if (!isValidGeoPoint((body as any).donationLocation)) {
    delete (body as any).donationLocation;
  }

  try {
    // 1) ابحث بالـ firebaseUID
    let user = await User.findOne({ firebaseUID: uid });
    if (user) {
      if (!user.firebaseUID) {
        user.firebaseUID = uid; // ربط أول مرة
      } else if (user.firebaseUID !== uid) {
        // 🔁 إعادة ربط آمنة لأننا نثق بتوكن Firebase لهذا البريد
        user.firebaseUID = uid;
      }
    } else {
      // إنشاء سجل جديد
      user = new User({
        fullName,
        email,
        firebaseUID: uid,
        ...body,
      });
    }
    // 2) إن لم يوجد، ابحث بالإيميل
    if (!user && email) {
      user = await User.findOne({ email: email });
      if (user) {
        if (!user.firebaseUID) {
          // اربط الحساب الموجود بملف Firebase الجديد
          user.firebaseUID = uid;
        } else if (user.firebaseUID !== uid) {
          // هذا البريد مربوط بحساب Firebase آخر
          res.status(409).json({
            message: "هذا البريد مرتبط بحساب آخر. سجّل الدخول.",
            code: "EMAIL_LINK_CONFLICT",
          });
          return;
        }
      }
    }

    // 3) أنشئ أو حدّث
    if (!user) {
      user = new User({
        fullName,
        email,
        firebaseUID: uid,
        ...body,
      });
    } else {
      // ⚠️ لا نستبدل الاسم الموجود إلا إذا كان فارغًا/افتراضيًا
      if (
        fullName &&
        fullName !== "مستخدم" &&
        (!user.fullName || user.fullName === "مستخدم")
      ) {
        user.fullName = fullName;
      }

      // مثال آمن للهاتف: لا تسقط الموجود بقيمة افتراضية
      if (typeof body.phone !== "undefined" && !user.phone) {
        user.phone = body.phone;
      }

      if (isValidGeoPoint((body as any).donationLocation)) {
        (user as any).donationLocation = (body as any).donationLocation;
      }
      // لا تغيّر email هنا إلا لو كان فارغًا في السجل
      if (!user.email && email) user.email = email;
    }

    const saved = await user.save();
    res.status(200).json(saved);
    return;
  } catch (err: any) {
    // معالجة تكرار الإيميل كتعامل منطقي وليس 500
    if (err?.code === 11000 && err?.keyPattern?.email) {
      // جرّب ربط الحساب الموجود بالإيميل مع uid الحالي إن لم يكن مربوطًا
      const existing = await User.findOne({ email });
      if (existing) {
        if (!existing.firebaseUID || existing.firebaseUID === uid) {
          existing.firebaseUID = uid;
          if (fullName) existing.fullName = fullName;
          if (typeof (body as any).phone !== "undefined")
            existing.phone = (body as any).phone;
          if (isValidGeoPoint((body as any).donationLocation)) {
            (existing as any).donationLocation = (body as any).donationLocation;
          }
          const saved = await existing.save();
          res.status(200).json(saved);
          return;
        }
        res.status(409).json({
          message: "هذا البريد مستخدم من حساب آخر.",
          code: "EMAIL_TAKEN",
        });
        return;
      }
    }

    console.error("❌ Error saving user:", err);
    res.status(500).json({ message: "Error saving user", error: err?.message });
    return;
  }
};
export const getDeleteEligibility = async (req: Request, res: Response) => {
  try {
    const fbUid = req.user?.uid;
    if (!fbUid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user: any = await User.findOne({ firebaseUID: fbUid })
      .select("wallet")
      .lean();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const hasBalance = (user.wallet?.balance || 0) > 0;

    // الحالات التي تعتبر "نشِطة" وتمنع الحذف — عدّلها لما يناسب نظامك
    const ACTIVE_STATUSES = ["pending", "accepted", "assigned", "in_progress"];
    const blockingOrder = await Order.findOne({
      user: (user as any)._id,
      status: { $in: ACTIVE_STATUSES },
    })
      .select("_id status")
      .lean();

    const reasons: string[] = [];
    if (hasBalance) reasons.push("يوجد رصيد في المحفظة. اسحب رصيدك أولًا.");
    if (blockingOrder)
      reasons.push(
        `يوجد طلب قيد المعالجة (#${blockingOrder._id}). ألغِ الطلب أولًا.`
      );

    res.json({ canDelete: reasons.length === 0, reasons });
    return;
  } catch (e) {
    res.status(500).json({ message: "Failed to check eligibility" });
    return;
  }
};
export const deleteMyAccount = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const fbUid = req.user?.uid;
    if (!fbUid) {
      await session.abortTransaction();
      {
        res.status(401).json({ message: "Unauthorized" });

        return;
      }
    }

    const user: any = await User.findOne({ firebaseUID: fbUid }).session(
      session
    );
    if (!user) {
      await session.abortTransaction();
      res.status(404).json({ message: "User not found" });
      return;
    }

    // منع الحذف في حال الرصيد/الطلبات الفعالة
    const hasBalance = (user.wallet?.balance || 0) > 0;
    const ACTIVE_STATUSES = ["pending", "accepted", "assigned", "in_progress"];
    const blockingOrder = await Order.findOne({
      user: user._id,
      status: { $in: ACTIVE_STATUSES },
    }).session(session);

    if (hasBalance || blockingOrder) {
      await session.abortTransaction();
      res.status(409).json({
        message: "لا يمكن الحذف.",
        reasons: [
          ...(hasBalance ? ["يوجد رصيد في المحفظة."] : []),
          ...(blockingOrder
            ? [`يوجد طلب قيد المعالجة (#${blockingOrder._id}).`]
            : []),
        ],
      });
      return;
    }

    // إزالة البيانات الشخصية + وسم محذوف
    anonymizeUserDoc(user);
    await user.save({ session });

    // حذف رموز الإشعارات المرتبطة (إن وُجد موديل)
    try {
      const NotificationToken = mongoose.model("NotificationToken");
      await NotificationToken.deleteMany({ userId: user._id }).session(session);
    } catch {}

    // تعليم الطلبات المغلقة بأنها تخص مستخدمًا محذوفًا (اختياري)
    try {
      await Order.updateMany(
        { user: user._id, status: { $in: ["completed", "cancelled"] } },
        { $set: { userDeleted: true } },
        { session }
      );
    } catch {}

    await session.commitTransaction();
    session.endSession();

    // بعد نجاح DB: إبطال وحذف مستخدم Firebase (اختياري)
    try {
      if (adminAuth && user.firebaseUID) {
        await adminAuth.revokeRefreshTokens(user.firebaseUID);
        await adminAuth.deleteUser(user.firebaseUID);
      }
    } catch {}

    res.json({ ok: true });
    return;
  } catch (e) {
    try {
      await session.abortTransaction();
    } catch {}
    session.endSession();
    res.status(500).json({ message: "Failed to delete account" });
    return;
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  const limit = Math.min(parseInt((req.query.limit as string) || "20"), 50);
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const users = await User.find({
    $or: [
      { fullName: regex },
      { name: regex },
      { phone: { $regex: q, $options: "i" } },
    ],
  })
    .select("_id fullName name phone")
    .limit(limit)
    .lean();
  res.json(users);
  return;
};
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findOne({ firebaseUID: req.user.uid }).lean();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // 🔍 استخراج العنوان الافتراضي بدقة
    let defaultAddress = null;

    if (user.defaultAddressId && user.addresses?.length > 0) {
      defaultAddress = user.addresses.find(
        (addr: any) =>
          addr._id?.toString() === user.defaultAddressId?.toString()
      );
    }

    // fallback إذا لم يوجد defaultAddressId أو لم يتطابق
    if (!defaultAddress && user.addresses?.length > 0) {
      defaultAddress = user.addresses[0];
    }

    res.status(200).json({
      ...user,
      defaultAddressId: user.defaultAddressId || defaultAddress?._id || null,
      defaultAddress,
    });
    return;
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findOne({ firebaseUID: req.user.uid });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { fullName, aliasName, phone, language, theme, profileImage } =
      req.body;

    // ✅ تحقق من undefined فقط (للسماح بالقيم الفارغة)
    if (fullName !== undefined) user.fullName = fullName;
    if (aliasName !== undefined) user.aliasName = aliasName;
    if (phone !== undefined) user.phone = phone;
    if (language !== undefined) user.language = language;
    if (theme !== undefined) user.theme = theme;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    res.status(200).json(user);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Error updating profile", error: err });
  }
};

export const updateSecurity = async (req: Request, res: Response) => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { pinCode, twoFactorEnabled } = req.body;

    if (pinCode) user.security.pinCode = pinCode;
    if (typeof twoFactorEnabled === "boolean") {
      user.security.twoFactorEnabled = twoFactorEnabled;
    }

    await user.save();
    res.status(200).json({ message: "Security settings updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating security", error: err });
  }
};

export const getLoginHistory = async (req: Request, res: Response) => {
  if (!req.user?.uid) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await User.findOne({ firebaseUID: req.user.uid });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(user.loginHistory || []);
};

export const setPinCode = async (req: Request, res: Response) => {
  const { pinCode } = req.body;
  if (!pinCode) {
    res.status(400).json({ message: "PIN is required" });
    return;
  }
  if (!req.user?.uid) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const user = await User.findOne({ firebaseUID: req.user.uid });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  user.security.pinCode = pinCode;
  await user.save();
  res.json({ message: "PIN set successfully" });
};

export const verifyPinCode = async (req: Request, res: Response) => {
  const { pinCode } = req.body;
  if (!req.user?.uid) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const user = await User.findOne({ firebaseUID: req.user.uid });
  if (!user || !user.security.pinCode) {
    res.status(404).json({ message: "No PIN set for this user" });
    return;
  }

  if (user.security.pinCode !== pinCode) {
    res.status(403).json({ message: "Incorrect PIN" });
    return;
  }

  res.json({ message: "PIN verified" });
};

export const getUserStats = async (req: Request, res: Response) => {
  if (!req.user?.uid) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await User.findOne({ firebaseUID: req.user.uid });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const stats = {
    postsCount: user.postsCount || 0,
    followersCount: user.followersCount || 0,
    favoritesCount: user.favorites?.length || 0,
    messagesCount: user.messagesCount || 0,
  };

  res.json(stats);
};

export const deactivateAccount = async (req: Request, res: Response) => {
  if (!req.user?.uid) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await User.findOne({ firebaseUID: req.user.uid });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  user.isActive = false;
  await user.save();
  res.json({ message: "Account deactivated" });
};

export const getAddresses = async (req: Request, res: Response) => {
  try {
    const firebaseUID = req.user?.uid; // ✅
    if (!firebaseUID) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // ابحث حسب Firebase UID
    const user = await User.findOne({ firebaseUID })
      .select("addresses defaultAddressId")
      .exec();

    if (!user) {
      res.status(404).json({ message: "المستخدم غير موجود" });
      return;
    }

    res.json({
      addresses: user.addresses,
      defaultAddressId: (user as any).defaultAddressId,
    });
    return;
  } catch (err: any) {
    res.status(500).json({ message: err.message });
    return;
  }
};
