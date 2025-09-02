// server/src/controllers/payroll.controller.ts
import { Request, Response } from 'express';
import { Payroll } from '../../models/er/payroll.model';
import { LedgerEntry } from '../../models/er/ledgerEntry.model';

export const getAllPayrolls = async (req: Request, res: Response) => {
  const items = await Payroll.find().populate('employee');
  res.json(items);
};

export const getPayrollById = async (req: Request, res: Response) => {
  const item = await Payroll.findById(req.params.id).populate('employee');
  res.json(item);
};

export const createPayroll = async (req: Request, res: Response) => {
  const item = new Payroll(req.body);
  await item.save();
  res.status(201).json(item);
};

export const updatePayroll = async (req: Request, res: Response) => {
  const updated = await Payroll.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  ).populate('employee');
  res.json(updated);
};

export const deletePayroll = async (req: Request, res: Response) => {
  await Payroll.findByIdAndDelete(req.params.id);
  res.status(204).send();
};
export const processPayroll = async (req: Request, res: Response) => {
  // البيانات الواردة: employee, periodStart, periodEnd, grossAmount, deductions, incentives
  const { employee, periodStart, periodEnd, grossAmount, deductions = 0, incentives = 0 } = req.body;

  const netAmount = grossAmount + incentives - deductions;
  const payroll = new Payroll({ employee, periodStart, periodEnd, grossAmount, deductions, netAmount, status: 'processed' });
  await payroll.save();

  // 1) قيد مصروف الرواتب (Debit)
  await LedgerEntry.create({
    date:        new Date(),
    description: `رواتب ${employee} للفترة ${periodStart.toISOString().slice(0,10)} إلى ${periodEnd.toISOString().slice(0,10)}`,
    debitAccount:  'Salary Expense',
    creditAccount: 'Salary Payable',
    amount:      grossAmount,
    refType:     'Payroll',
    refId:       payroll._id,
  });

  // 2) قيد استقطاعات (Credit)
  if (deductions > 0) {
    await LedgerEntry.create({
      date:        new Date(),
      description: `استقطاعات ${employee}`,
      debitAccount:  'Salary Payable',
      creditAccount: 'Deductions Payable',
      amount:      deductions,
      refType:     'Payroll',
      refId:       payroll._id,
    });
  }

  // 3) قيد الحوافز (Debit مصروف)
  if (incentives > 0) {
    await LedgerEntry.create({
      date:        new Date(),
      description: `حوافز ${employee}`,
      debitAccount:  'Incentives Expense',
      creditAccount: 'Incentives Payable',
      amount:      incentives,
      refType:     'Payroll',
      refId:       payroll._id,
    });
  }

  // 4) قيد الصرف الصافي (Credit)
  await LedgerEntry.create({
    date:        new Date(),
    description: `صرف صافي راتب ${employee}`,
    debitAccount:  'Salary Payable',
    creditAccount: 'Cash',
    amount:      netAmount,
    refType:     'Payroll',
    refId:       payroll._id,
  });

  res.status(201).json(payroll);
};
