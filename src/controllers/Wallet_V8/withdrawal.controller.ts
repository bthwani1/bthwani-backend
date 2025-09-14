import { Request, Response } from "express";
import { WithdrawalRequest } from "../../models/Wallet_V8/WithdrawalRequest";
import { User } from "../../models/user";
import mongoose from "mongoose";
import { available } from "../../utils/money";
import { WalletTransaction } from "../../models/Wallet_V8/wallet.model";
// 1. تقديم طلب سحب
export const requestWithdrawal = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { amount, accountInfo, method } = req.body;
  const FEE = 500;

  if (!Number.isInteger(amount) || amount <= 0) {
    res.status(400).json({ error: "المبلغ غير صالح" });
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const total = amount + FEE;

    const request = new WithdrawalRequest({
      userId,
      amount,
      accountInfo,
      method: method || "agent",
      status: "pending",
      fee: FEE,
    });
    await request.save({ session });

    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("المستخدم غير موجود");
    if (available(user.wallet) < total)
      throw new Error("الرصيد المتاح غير كافٍ");

    // احجز المبلغ
    user.wallet.onHold = (user.wallet.onHold || 0) + total;
    user.wallet.lastUpdated = new Date();
    await user.save({ session });

    // قيد حجز للسحب
    await WalletTransaction.create(
      [
        {
          userId,
          userModel: "User",
          amount: total,
          type: "debit",
          method: "withdrawal",
          status: "pending", // انتظار موافقة الأدمن
          description: `Withdrawal request ${request._id} (amount ${amount} + fee ${FEE})`,
          meta: { withdrawalId: String(request._id) },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, message: "تم تقديم الطلب", id: request._id });
  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: e.message });
  }
};

// 2. عرض الطلبات للإدارة
export const getAllWithdrawals = async (_req: Request, res: Response) => {
  const requests = await WithdrawalRequest.find()
    .populate("userId", "fullName phone")
    .sort({ requestedAt: -1 });
  res.json(requests);
};

// 3. اعتماد أو رفض الطلب
export const processWithdrawal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approve, adminNote } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const request = await WithdrawalRequest.findById(id).session(session);
    if (!request) throw new Error("الطلب غير موجود");
    if (request.status !== "pending")
      throw new Error("تمت معالجة الطلب مسبقاً");

    const user = await User.findById(request.userId).session(session);
    if (!user) throw new Error("المستخدم غير موجود");

    const total = request.amount + (request.fee || 0);

    // اجلب قيد الحجز
    const pendingTx = await WalletTransaction.findOne({
      userId: request.userId,
      method: "withdrawal",
      status: "pending",
      "meta.withdrawalId": String(request._id),
    }).session(session);
    if (!pendingTx) throw new Error("سجل الحجز غير موجود");

    if (approve) {
      // Capture: نزّل من onHold ومن balance فعليًا
      if ((user.wallet.onHold || 0) < total) throw new Error("Hold mismatch");
      if (user.wallet.balance < total)
        throw new Error("الرصيد أقل من الإجمالي"); // حماية إضافية

      user.wallet.onHold -= total;
      user.wallet.balance -= total;
      user.wallet.totalSpent += total;
      user.wallet.lastUpdated = new Date();
      user.transactions.push({
        amount: total,
        type: "debit",
        method: "withdrawal",
        status: "completed",
        description: `Withdrawal approved (${request._id})`,
        date: new Date(),
      });
      await user.save({ session });

      pendingTx.status = "completed";
      await pendingTx.save({ session });

      request.status = "approved";
      request.processedAt = new Date();
      request.adminNote = adminNote;
    } else {
      // Release: أفرج عن الحجز فقط
      if ((user.wallet.onHold || 0) < total) throw new Error("Hold mismatch");
      user.wallet.onHold -= total;
      user.wallet.lastUpdated = new Date();
      await user.save({ session });

      pendingTx.status = "reversed";
      await pendingTx.save({ session });

      request.status = "rejected";
      request.processedAt = new Date();
      request.adminNote = adminNote;
    }

    await request.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, status: request.status });
  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: e.message });
  }
};
