// controllers/admin/wallet.admin.controller.ts
import mongoose from "mongoose";
import { Request, Response } from "express";
import { User } from "../../models/user";
import { Coupon } from "../../models/Wallet_V8/coupon.model";

export const listCoupons = async (req: Request, res: Response) => {
  const { q, assignedTo } = req.query as { q?: string; assignedTo?: string };
  const filter: any = {};
  if (q) filter.code = { $regex: q, $options: "i" };
  if (assignedTo) filter.assignedTo = assignedTo;
  const coupons = await Coupon.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json(coupons);
};

export const searchUsers = async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim();
  if (!q) {
    res.json([]);
    return;
  }

  const or: any[] = [
    { email: q },
    { phone: q },
    { firebaseUID: q },
    { fullName: { $regex: q, $options: "i" } },
  ];
  if (mongoose.isValidObjectId(q)) or.push({ _id: q });

  const users = await User.find({ $or: or })
    .select("_id fullName email phone wallet.balance wallet.onHold")
    .limit(50)
    .lean();

  res.json(users);
};

type WalletOpBody = { userId: string; amount: number; reason?: string };

export const adminCreditWallet = async (req: Request, res: Response) => {
  const { userId, amount, reason } = req.body as WalletOpBody;
  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ message: "userId + amount>0 required" });
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user: any = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    user.wallet = user.wallet || {
      balance: 0,
      onHold: 0,
      loyaltyPoints: 0,
      transactions: [],
    };
    user.wallet.balance = (user.wallet.balance || 0) + amount;

    // سجل معاملة
    user.wallet.transactions = user.wallet.transactions || [];
    user.wallet.transactions.push({
      type: "credit",
      method: "admin",
      amount,
      description: reason || "إيداع من الأدمن",
      date: new Date(),
      balanceAfter: user.wallet.balance,
    });

    await user.save({ session, validateModifiedOnly: true });
    await session.commitTransaction();
    res.json({ ok: true, balance: user.wallet.balance });
  } catch (e: any) {
    await session.abortTransaction();
    res.status(500).json({ message: e.message });
  } finally {
    session.endSession();
  }
};

export const adminDebitWallet = async (req: Request, res: Response) => {
  const { userId, amount, reason } = req.body as WalletOpBody;
  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ message: "userId + amount>0 required" });
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user: any = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const available = (user.wallet.balance || 0) - (user.wallet.onHold || 0);
    if (available < amount) {
      res.status(400).json({ message: "الرصيد المتاح أقل من المبلغ المطلوب" });
      await session.abortTransaction();
      return;
    }

    user.wallet.balance -= amount;
    user.wallet.transactions = user.wallet.transactions || [];
    user.wallet.transactions.push({
      type: "debit",
      method: "admin",
      amount,
      description: reason || "خصم من الأدمن",
      date: new Date(),
      balanceAfter: user.wallet.balance,
    });

    await user.save({ session, validateModifiedOnly: true });
    await session.commitTransaction();
    res.json({ ok: true, balance: user.wallet.balance });
  } catch (e: any) {
    await session.abortTransaction();
    res.status(500).json({ message: e.message });
  } finally {
    session.endSession();
  }
};
