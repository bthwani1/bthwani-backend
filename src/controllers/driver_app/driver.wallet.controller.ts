// src/controllers/driver_app/driver.wallet.controller.ts

import { Request, Response } from "express";
import { WalletTransaction } from "../../models/Wallet_V8/wallet.model";
import mongoose from "mongoose";
import Driver from "../../models/Driver_app/driver";

export const getDriverWalletSummary = async (req: Request, res: Response) => {
  const driverId = new mongoose.Types.ObjectId(req.user!.id);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7*24*60*60*1000);

  // credit مكتملة للكابتن = أرباح
  const baseFilter = {
    userId: driverId,
    userModel: "Driver",
    status: "completed",
  } as any;

  const [todayAgg] = await WalletTransaction.aggregate([
    { $match: { ...baseFilter, type: "credit", createdAt: { $gte: startOfToday } } },
    { $group: { _id: null, amount: { $sum: "$amount" } } }
  ]);

  const [weeklyAgg] = await WalletTransaction.aggregate([
    { $match: { ...baseFilter, type: "credit", createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: null, amount: { $sum: "$amount" } } }
  ]);

  const [totalAgg] = await WalletTransaction.aggregate([
    { $match: { ...baseFilter, type: "credit" } },
    { $group: { _id: null, amount: { $sum: "$amount" } } }
  ]);

  // المعلّق: معاملات escrow أو أي تدفّقات قيد الانتظار على الكابتن
  const [pendingAgg] = await WalletTransaction.aggregate([
    { $match: { userId: driverId, userModel: "Driver", status: "pending" } },
    { $group: { _id: null, amount: { $sum: "$amount" } } }
  ]);

  // الحصول على رصيد الكابتن من جدول Driver
  const driver = await Driver.findById(driverId).select("wallet.balance");

  res.json({
    balance: driver?.wallet?.balance || 0, // الرصيد الحي من Driver.wallet.balance
    totalEarnings: totalAgg?.amount || 0,
    todayEarnings: todayAgg?.amount || 0,
    weeklyEarnings: weeklyAgg?.amount || 0,
    pendingPayments: pendingAgg?.amount || 0,
  });
};
