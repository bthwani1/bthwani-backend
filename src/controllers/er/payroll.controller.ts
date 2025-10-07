// server/src/controllers/er/payroll.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Payroll } from "../../models/er/payroll.model";
import { LedgerEntry } from "../../models/er/ledgerEntry.model";

export const getAllPayrolls = async (_req: Request, res: Response) => {
  const items = await Payroll.find().populate("employee");
  res.json(items);
};

export const getPayrollById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
     res.status(400).json({ message: "Invalid payroll id" });
     return;
  }
  const item = await Payroll.findById(id).populate("employee");
  if (!item) {
    res.status(404).json({ message: "Payroll not found" });
    return;
  } 
  res.json(item);
};

export const createPayroll = async (req: Request, res: Response) => {
  const item = new Payroll(req.body);
  await item.save();
  res.status(201).json(item);
};

export const updatePayroll = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid payroll id" });
    return;
  }
  const updated = await Payroll.findByIdAndUpdate(id, req.body, {
    new: true,
  }).populate("employee");
  if (!updated) {
    res.status(404).json({ message: "Payroll not found" });
    return;
  }
  res.json(updated);
};

export const deletePayroll = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid payroll id" });
    return;
  }
  await Payroll.findByIdAndDelete(id);
  res.status(204).send();
};

// === إحصاءات الرواتب لواجهة الكروت في الفرونت ===
export const getPayrollStats = async (req: Request, res: Response) => {
  // فلاتر اختيارية: ?status=processed&from=2025-10-01&to=2025-10-31
  const { status, from, to } = req.query;
  const match: Record<string, any> = {};

  if (typeof status === "string") match.status = status;
  if (typeof from === "string")
    match.periodStart = { ...(match.periodStart || {}), $gte: new Date(from) };
  if (typeof to === "string")
    match.periodEnd = { ...(match.periodEnd || {}), $lte: new Date(to) };

  const [row] = await Payroll.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalGross: { $sum: "$grossAmount" },
        totalDeductions: { $sum: "$deductions" },
        totalNet: { $sum: "$netAmount" },
        processedCount: {
          $sum: { $cond: [{ $eq: ["$status", "processed"] }, 1, 0] },
        },
      },
    },
  ]);

  const employees = await Payroll.distinct("employee", match);

  res.json({
    totalGross: row?.totalGross ?? 0,
    totalDeductions: row?.totalDeductions ?? 0,
    totalNet: row?.totalNet ?? 0,
    processedCount: row?.processedCount ?? 0,
    totalEmployees: employees.length,
  });
};

// === معالجة الراتب مع القيود (كما عندك) ===
export const processPayroll = async (req: Request, res: Response) => {
  const {
    employee,
    periodStart,
    periodEnd,
    grossAmount,
    deductions = 0,
    incentives = 0,
  } = req.body;
  const netAmount = grossAmount + incentives - deductions;

  const payroll = new Payroll({
    employee,
    periodStart,
    periodEnd,
    grossAmount,
    deductions,
    netAmount,
    status: "processed",
  });
  await payroll.save();

  await LedgerEntry.create({
    date: new Date(),
    description: `رواتب ${employee} للفترة ${new Date(periodStart)
      .toISOString()
      .slice(0, 10)} إلى ${new Date(periodEnd).toISOString().slice(0, 10)}`,
    debitAccount: "Salary Expense",
    creditAccount: "Salary Payable",
    amount: grossAmount,
    refType: "Payroll",
    refId: payroll._id,
  });

  if (deductions > 0) {
    await LedgerEntry.create({
      date: new Date(),
      description: `استقطاعات ${employee}`,
      debitAccount: "Salary Payable",
      creditAccount: "Deductions Payable",
      amount: deductions,
      refType: "Payroll",
      refId: payroll._id,
    });
  }

  if (incentives > 0) {
    await LedgerEntry.create({
      date: new Date(),
      description: `حوافز ${employee}`,
      debitAccount: "Incentives Expense",
      creditAccount: "Incentives Payable",
      amount: incentives,
      refType: "Payroll",
      refId: payroll._id,
    });
  }

  await LedgerEntry.create({
    date: new Date(),
    description: `صرف صافي راتب ${employee}`,
    debitAccount: "Salary Payable",
    creditAccount: "Cash",
    amount: netAmount,
    refType: "Payroll",
    refId: payroll._id,
  });

  res.status(201).json(payroll);
};
