// server/src/controllers/leaveRequest.controller.ts
import { Request, Response } from 'express';
import { LeaveRequest } from '../../models/er/leaveRequest.model';

export const getLeaves = async (req: Request, res: Response) => {
  const list = await LeaveRequest.find({ employee: req.query.employee });
  res.json(list);
};

export const createLeave = async (req: Request, res: Response) => {
  const lv = new LeaveRequest(req.body);
  await lv.save();
  res.status(201).json(lv);
};

export const updateLeave = async (req: Request, res: Response) => {
  const lv = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(lv);
};