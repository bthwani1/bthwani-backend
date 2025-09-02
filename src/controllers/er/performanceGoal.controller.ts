// server/src/controllers/performanceGoal.controller.ts
import { Request, Response } from 'express';
import { PerformanceGoal } from '../../models/er/performanceGoal.model';

export const getGoals = async (req: Request, res: Response) => {
  const list = await PerformanceGoal.find({ employee: req.query.employee });
  res.json(list);
};

export const createGoal = async (req: Request, res: Response) => {
  const g = new PerformanceGoal(req.body);
  await g.save();
  res.status(201).json(g);
};

export const updateGoal = async (req: Request, res: Response) => {
  const g = await PerformanceGoal.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(g);
};