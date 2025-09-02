// server/src/controllers/ledgerEntry.controller.ts
import { Request, Response } from 'express';
import { LedgerEntry } from '../../models/er/ledgerEntry.model';

export const getAllEntries = async (req: Request, res: Response) => {
  const entries = await LedgerEntry.find();
  res.json(entries);
};

export const getEntryById = async (req: Request, res: Response) => {
  const entry = await LedgerEntry.findById(req.params.id);
  res.json(entry);
};

export const createEntry = async (req: Request, res: Response) => {
  const entry = new LedgerEntry(req.body);
  await entry.save();
  res.status(201).json(entry);
};

export const updateEntry = async (req: Request, res: Response) => {
  const updated = await LedgerEntry.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
};

export const deleteEntry = async (req: Request, res: Response) => {
  await LedgerEntry.findByIdAndDelete(req.params.id);
  res.status(204).send();
};