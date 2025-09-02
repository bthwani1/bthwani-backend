import { Request, Response } from "express";
import { WithdrawalRequest } from "../../models/Wallet_V8/WithdrawalRequest";
import { User } from "../../models/user";

// 1. تقديم طلب سحب
export const requestWithdrawal = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { amount, accountInfo, method } = req.body;

  if (amount <= 0) {
    res.status(400).json({ error: "المبلغ غير صالح" });
    return;
  }

  const request = new WithdrawalRequest({
    userId,
    amount,
    accountInfo,
    method,
  });

  await request.save();
  // (اختياري) إرسال إشعار للإدارة

  res.json({ success: true, message: "تم تقديم الطلب" });
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
  const FEE = 500;

  const request = await WithdrawalRequest.findById(id);
  if (!request) {
    res.status(404).json({ error: "الطلب غير موجود" });
    return;
  }
  if (request.status !== "pending") {
    res.status(400).json({ error: "تمت معالجة الطلب مسبقاً" });
    return;
  }

  const user = await User.findById(request.userId);
  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }

  if (approve) {
    const total = request.amount + FEE;
    if (user.wallet.balance < total) {
      res.status(400).json({ error: "الرصيد غير كافٍ" });

      return;
    }

    user.wallet.balance -= total;
    user.wallet.totalSpent += total;
    user.transactions.push({
      amount: request.amount,
      type: "debit",
      method: "withdrawal",
      status: "completed", // ✅ مضافة هنا

      description: `سحب بواسطة الإدارة (خصم ${FEE} رسوم)`,
      date: new Date(), // ✅ اجعل النوع متوافق تمامًا
    });

    await user.save();

    request.status = "approved";
    request.processedAt = new Date();
    request.fee = FEE;
    request.adminNote = adminNote;
  } else {
    request.status = "rejected";
    request.adminNote = adminNote;
  }

  await request.save();
  res.json({ success: true, status: request.status });
};
