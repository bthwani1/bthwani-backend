import { Request, Response } from "express";
import  Driver  from "../../models/Driver_app/driver";
import { WithdrawalRequest } from "../../models/Wallet_V8/WithdrawalRequest";

export const listWithdrawals = async (req: Request, res: Response) => {
  const requests = await WithdrawalRequest.find().populate(
    "userId",
    "fullName phone role"
  );
  res.json(requests);
};

export const approveWithdrawal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const request = await WithdrawalRequest.findById(id);
  if (!request || request.status !== "pending") {
    res.status(400).json({ message: "Invalid or already processed request" });
    return;
  }

  const driver = await Driver.findById(request.userId);
  if (!driver || driver.wallet.balance < request.amount) {
    res.status(400).json({ message: "Insufficient balance" });
    return;
  }

  driver.wallet.balance -= request.amount;
  await driver.save();

  request.status = "approved";
  request.processedAt = new Date();
  await request.save();

  res.json({ message: "Withdrawal approved", request });
};

export const rejectWithdrawal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminNote } = req.body;

  const request = await WithdrawalRequest.findById(id);
  if (!request || request.status !== "pending") {
    res.status(400).json({ message: "Invalid or already processed request" });
    return;
  }

  request.status = "rejected";
  request.adminNote = adminNote;
  request.processedAt = new Date();
  await request.save();

  res.json({ message: "Withdrawal rejected", request });
};
