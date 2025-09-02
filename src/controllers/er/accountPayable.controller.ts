// server/src/controllers/accountPayable.controller.ts
import { Request, Response } from 'express';
import { AccountPayable } from '../../models/er/accountPayable.model';
import { LedgerEntry } from '../../models/er/ledgerEntry.model';

export const getAllPayables = async (req: Request, res: Response) => {
  const items = await AccountPayable.find();
  res.json(items);
};

export const getPayableById = async (req: Request, res: Response) => {
  const item = await AccountPayable.findById(req.params.id);
  res.json(item);
};

export const createPayable = async (req: Request, res: Response) => {
  const ap = new AccountPayable(req.body);
  await ap.save();

  // قيد محاسبي: مصروفات ومورد
  await LedgerEntry.create({
    date:        ap.issueDate,
    description: `فاتورة مورد ${ap.vendor} رقم ${ap.invoiceNumber}`,
    debitAccount:  'Purchase Expense',
    creditAccount: 'Accounts Payable',
    amount:      ap.amount,
    refType:     'AP',
    refId:       ap._id,
  });

  res.status(201).json(ap);
};

export const updatePayable = async (req: Request, res: Response) => {
  const updated = await AccountPayable.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
};

export const deletePayable = async (req: Request, res: Response) => {
  await AccountPayable.findByIdAndDelete(req.params.id);
  res.status(204).send();
};