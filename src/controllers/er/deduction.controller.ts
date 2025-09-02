// server/src/controllers/deduction.controller.ts
import { Request, Response } from 'express';
import { Deduction } from '../../models/er/deduction.model';
import { LedgerEntry } from '../../models/er/ledgerEntry.model';

export const recordDeduction = async (req: Request, res: Response) => {
  const ded = new Deduction(req.body);
  await ded.save();

  // قيد محاسبي: خصم راتب
  await LedgerEntry.create({
    date:        ded.date,
    description: `خصم غياب لموظف ${ded.employee}`,
    debitAccount:  'Salary Expense',
    creditAccount: 'Cash',
    amount:      ded.amount,
    refType:     'Deduction',
    refId:       ded._id,
  });

  res.status(201).json(ded);
};
