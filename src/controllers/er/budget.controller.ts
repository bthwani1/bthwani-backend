// server/src/controllers/budget.controller.ts
import { Request, Response } from 'express';
import { Budget } from '../../models/er/budget.model';

export const getAllBudgets = async (req: Request, res: Response) => {
  const items = await Budget.find();
  res.json(items);
};

export const getBudgetByYear = async (req: Request, res: Response) => {
  const item = await Budget.findOne({ year: Number(req.params.year) });
  res.json(item);
};

export const createBudget = async (req: Request, res: Response) => {
  const item = new Budget(req.body);
  await item.save();
  res.status(201).json(item);
};

export const updateBudget = async (req: Request, res: Response) => {
  const updated = await Budget.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
};

export const deleteBudget = async (req: Request, res: Response) => {
  await Budget.findByIdAndDelete(req.params.id);
  res.status(204).send();
};