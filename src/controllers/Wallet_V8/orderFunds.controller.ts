// src/controllers/Wallet_V8/orderFunds.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../../models/user";
import { WalletTransaction } from "../../models/Wallet_V8/wallet.model";
import { isIntAmount, available } from "../../utils/money";

export const holdFunds = async (req: Request, res: Response) => {
  const { orderId, amount } = req.body;
  const userId = req.user!.id;

  if (!orderId || !isIntAmount(amount)) {
    res
      .status(400)
      .json({ success: false, error: "orderId مطلوب و amount عدد صحيح موجب" });
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");
    if (available(user.wallet) < amount) throw new Error("رصيد متاح غير كافٍ");

    // idempotent: لو الحجز موجود لا نكرر
    const dup = await WalletTransaction.findOne({
      userId,
      "meta.orderId": orderId,
      method: "escrow",
      status: "pending",
    }).session(session);
    if (dup) {
      // موجود بالفعل
      await session.abortTransaction();
      session.endSession();
      res.json({ success: true, alreadyHeld: true });
      return;
    }

    user.wallet.onHold = (user.wallet.onHold || 0) + amount;
    user.wallet.lastUpdated = new Date();
    await user.save({ session });

    await WalletTransaction.create(
      [
        {
          userId,
          userModel: "User",
          amount,
          type: "debit",
          method: "escrow",
          status: "pending",
          description: `Hold for order ${orderId}`,
          meta: { orderId },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true });
  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: e.message });
  }
};

export const captureHold = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const userId = req.user!.id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const holdTx = await WalletTransaction.findOne({
      userId,
      "meta.orderId": orderId,
      method: "escrow",
      status: "pending",
    }).session(session);
    if (!holdTx) throw new Error("لم يتم العثور على حجز لهذه العملية");

    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");
    if ((user.wallet.onHold || 0) < holdTx.amount)
      throw new Error("Hold mismatch");

    // نزّل المبلغ من onHold و balance فعليًا
    user.wallet.onHold -= holdTx.amount;
    user.wallet.balance -= holdTx.amount;
    user.wallet.totalSpent += holdTx.amount;
    user.wallet.lastUpdated = new Date();
    user.transactions.push({
      amount: holdTx.amount,
      type: "debit",
      method: "payment",
      status: "completed",
      description: `Capture for order ${orderId}`,
      date: new Date(),
    });
    await user.save({ session });

    // حدّث الحجز ليخرج من حالة الانتظار
    holdTx.status = "completed"; // سنستثنيه من التحليلات لاحقًا
    await holdTx.save({ session });

    // قيّد عملية الدفع الفعلية
    await WalletTransaction.create(
      [
        {
          userId,
          userModel: "User",
          amount: holdTx.amount,
          type: "debit",
          method: "payment",
          status: "completed",
          description: `Order capture ${orderId}`,
          meta: { orderId },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true });
  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: e.message });
  }
};

export const releaseHold = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const userId = req.user!.id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const holdTx = await WalletTransaction.findOne({
      userId,
      "meta.orderId": orderId,
      method: "escrow",
      status: "pending",
    }).session(session);
    if (!holdTx) throw new Error("لم يتم العثور على حجز لهذه العملية");

    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");
    if ((user.wallet.onHold || 0) < holdTx.amount)
      throw new Error("Hold mismatch");

    user.wallet.onHold -= holdTx.amount;
    user.wallet.lastUpdated = new Date();
    await user.save({ session });

    // علّم الحجز كمفرج/معكوس حتى لا يظهر كصرف
    holdTx.status = "reversed";
    await holdTx.save({ session });

    // (اختياري) قيد توضيحي
    await WalletTransaction.create(
      [
        {
          userId,
          userModel: "User",
          amount: holdTx.amount,
          type: "credit",
          method: "escrow",
          status: "completed",
          description: `Release hold for order ${orderId}`,
          meta: { orderId },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true });
  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: e.message });
  }
};
