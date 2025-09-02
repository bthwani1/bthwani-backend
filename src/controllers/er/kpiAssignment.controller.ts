// server/src/controllers/kpiAssignment.controller.ts
import { Request, Response } from 'express';
import { KpiAssignment } from '../../models/er/kpiAssignment.model';

export const getKpis = async (req: Request, res: Response) => {
  const list = await KpiAssignment.find({ employee: req.query.employee });
  res.json(list);
};

export const createKpi = async (req: Request, res: Response) => {
  const kpi = new KpiAssignment(req.body);
  await kpi.save();
  res.status(201).json(kpi);
};

export const updateKpi = async (req: Request, res: Response) => {
  const updated = await KpiAssignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

export const deleteKpi = async (req: Request, res: Response) => {
  await KpiAssignment.findByIdAndDelete(req.params.id);
  res.status(204).send();
};