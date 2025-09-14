import { Request, Response } from "express";
import { WalletTransaction } from "../../models/Wallet_V8/wallet.model";
import {
  sendPaymentToKuraimi,
  reverseKuraimiTransaction,
} from "../../utils/kuraimi";
import { User } from "../../models/user";
import mongoose from "mongoose";

// controllers/Wallet_V8/wallet.controller.ts (تعديل getWallet)
export const getWallet = async (req: Request, res: Response) => {
  try {
    const objId = (req as any).user?.id;
    const uid =
      (req as any).user?.firebaseUID || (req as any).firebaseUser?.uid;

    let user: any = null;

    // ✅ لا تستدع findById إلا لو كان ObjectId صالح
    if (objId && mongoose.isValidObjectId(objId)) {
      user = await User.findById(objId).select("wallet").lean();
    }

    if (!user && uid) {
      user = await User.findOne({ firebaseUID: uid }).select("wallet").lean();
    }

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const balance = user.wallet?.balance ?? 0;
    const onHold = user.wallet?.onHold ?? 0;
    const available = Math.max(0, balance - onHold);
    const loyaltyPoints = user.wallet?.loyaltyPoints ?? 0;

    // سجل المعاملات (اختياري)
    const userIdForTx =
      objId && mongoose.isValidObjectId(objId) ? objId : undefined;

    const transactions = userIdForTx
      ? await WalletTransaction.find({ user: userIdForTx })
          .sort({ createdAt: -1 })
          .limit(50)
          .select("description type amount createdAt")
          .lean()
      : [];

    res.json({ balance, onHold, available, loyaltyPoints, transactions });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
    return;
  }
};

export const verifyCustomer = async (req: Request, res: Response) => {
  try {
    const { SCustID, MobileNo } = req.body;
    const user = await User.findOne({ phone: MobileNo });
    if (!user) {
      res.status(404).json({ Code: "0", Message: "User not found" });
      return;
    }
    res.json({ Code: "1", SCustID });
    return;
  } catch (error) {
    res.status(500).json({ Code: "0", Message: "Error verifying customer" });
    return;
  }
};

export const chargeWalletViaKuraimi = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { amount, SCustID, PINPASS } = req.body;

  try {
    const paymentResult = await sendPaymentToKuraimi({
      amount,
      SCustID,
      PINPASS,
    });
    if (!paymentResult.success) throw new Error("Payment failed");

    const user = await User.findById(userId);
    user.wallet.balance += amount;
    user.wallet.totalEarned += amount;
    user.transactions.push({
      amount,
      type: "credit",
      description: "Kuraimi top-up",
      method: "kuraimi",
      status: "completed",
    });
    await user.save();

    const tx = new WalletTransaction({
      userId,
      amount,
      type: "credit",
      method: "kuraimi",
      description: "Top-up via Kuraimi",
      bankRef: paymentResult.refNo,
      meta: paymentResult.meta,
    });
    await tx.save();

    res.json({ success: true, balance: user.wallet.balance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const reverseTransaction = async (req: Request, res: Response) => {
  try {
    const { refNo } = req.params;
    const reversal = await reverseKuraimiTransaction(refNo);
    res.json({ success: true, result: reversal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
export const getWalletAnalytics = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await WalletTransaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        method: { $ne: "escrow" },
      },
    }, // 👈 استبعد الحجوزات
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
          type: "$type",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  res.json(result);
};
// GET /wallet/analytics/monthly
export const getMonthlySpending = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const monthly = Array(12).fill(0);
  const now = new Date();

  user.transactions.forEach((tx) => {
    if (tx.type === "debit" && tx.date) {
      const monthDiff = now.getMonth() - new Date(tx.date).getMonth();
      if (monthDiff >= 0 && monthDiff < 12) {
        monthly[11 - monthDiff] += tx.amount;
      }
    }
  });

  res.json({ monthly });
};
