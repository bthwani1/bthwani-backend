// server/src/controllers/accountReceivable.controller.ts
import { Request, Response } from 'express';
import { AccountReceivable } from '../../models/er/accountReceivable.model';
import { LedgerEntry } from '../../models/er/ledgerEntry.model';

export const getAllReceivables = async (req: Request, res: Response) => {
  const items = await AccountReceivable.find();
  res.json(items);
};

export const getReceivableById = async (req: Request, res: Response) => {
  const item = await AccountReceivable.findById(req.params.id);
  res.json(item);
};

export const createReceivable = async (req: Request, res: Response) => {
  const ar = new AccountReceivable(req.body);
  await ar.save();

  // قيد محاسبي: إيرادات
  await LedgerEntry.create({
    date:        ar.issueDate,
    description: `فاتورة لعميل ${ar.client} رقم ${ar.invoiceNumber}`,
    debitAccount:  'Accounts Receivable',
    creditAccount: 'Sales Revenue',
    amount:      ar.amount,
    refType:     'AR',
    refId:       ar._id,
  });

  res.status(201).json(ar);
};

export const updateReceivable = async (req: Request, res: Response) => {
  const updated = await AccountReceivable.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
};

export const deleteReceivable = async (req: Request, res: Response) => {
  await AccountReceivable.findByIdAndDelete(req.params.id);
  res.status(204).send();
};