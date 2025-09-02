// server/src/controllers/reports.controller.ts
import { Request, Response } from 'express';
import { LedgerEntry } from '../../models/er/ledgerEntry.model';

export const getIncomeStatement = async (req: Request, res: Response) => {
  const { from, to } = req.query;
  const result = await LedgerEntry.aggregate([
    { $match: { date: { $gte: new Date(from as string), $lte: new Date(to as string) } } },
    {
      $group: {
        _id: '$creditAccount',
        creditTotal: { $sum: '$amount' },
      },
    },
  ]);
  res.json(result);
};