// server/src/controllers/dashboard.controller.ts
import { Request, Response } from "express";
import { LedgerEntry } from "../../models/er/ledgerEntry.model";
import { Task } from "../../models/er/task.model";
import { PerformanceReview } from "../../models/er/performanceReview.model";

// مؤشرات مالية فورية
export const getFinancialOverview = async (req: Request, res: Response) => {
  const from = new Date(req.query.from as string);
  const to = new Date(req.query.to as string);
  const result = await LedgerEntry.aggregate([
    { $match: { date: { $gte: from, $lte: to } } },
    { $group: { _id: "$debitAccount", totalDebit: { $sum: "$amount" } } },
  ]);
  res.json(result);
};

// عدد المهام حسب الحالة
export const getTaskStats = async (req: Request, res: Response) => {
  const stats = await Task.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  res.json(stats);
};

// أداء الموظفين: متوسط overallScore
export const getEmployeePerformance = async (req: Request, res: Response) => {
  const stats = await PerformanceReview.aggregate([
    { $group: { _id: "$employee", avgScore: { $avg: "$overallScore" } } },
  ]);
  res.json(stats);
};

// تقرير نهاية الفترة
export const getPeriodReport = async (req: Request, res: Response) => {
  const { period } = req.query; // 'monthly','quarterly','yearly'
  // مثال: ربع سنوي
  const now = new Date();
  let start: Date;
  if (period === "monthly")
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (period === "quarterly")
    start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  else start = new Date(now.getFullYear(), 0, 1);

  const financials = await LedgerEntry.aggregate([
    { $match: { date: { $gte: start, $lte: now } } },
    { $group: { _id: "$creditAccount", total: { $sum: "$amount" } } },
  ]);
  const tasks = await Task.aggregate([
    { $match: { createdAt: { $gte: start, $lte: now } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  res.json({ financials, tasks });
};
