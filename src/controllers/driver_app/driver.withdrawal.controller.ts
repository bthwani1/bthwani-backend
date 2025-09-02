import { Request, Response } from "express";
import  Driver  from "../../models/Driver_app/driver";
import { WithdrawalRequest } from "../../models/Wallet_V8/WithdrawalRequest";

export const requestWithdrawal = async (req: Request, res: Response) => {
  const { amount, method, accountInfo } = req.body;

  const driver = await Driver.findById(req.user.id);
  if (!driver || driver.wallet.balance < amount) {
    res.status(400).json({ message: "Insufficient balance" });
    return;
  }

  const fee = Math.ceil(amount * 0.01); // مثال: 1% رسوم

  const withdrawal = await WithdrawalRequest.create({
    userId: driver._id,
    amount,
    fee,
    method,
    accountInfo,
    status: "pending",
    requestedAt: new Date(),
  });

  res.status(201).json({ message: "Withdrawal requested", withdrawal });
};

export const getMyWithdrawals = async (req: Request, res: Response) => {
  const withdrawals = await WithdrawalRequest.find({
    userId: req.user.id,
  }).sort({ requestedAt: -1 });
  res.json(withdrawals);
};
