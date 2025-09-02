// server/src/controllers/task.controller.ts
import { Request, Response } from 'express';
import { Task } from '../../models/er/task.model';
import { LedgerEntry } from '../../models/er/ledgerEntry.model';

export const getAllTasks = async (req: Request, res: Response) => {
  const tasks = await Task.find()
    .populate('assignedTo', 'fullName')
    .populate('createdBy', 'fullName');
  res.json(tasks);
};

export const getTaskById = async (req: Request, res: Response) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'fullName')
    .populate('createdBy', 'fullName');
  res.json(task);
};

export const createTask = async (req: Request, res: Response) => {
  const task = new Task(req.body);
  await task.save();
  res.status(201).json(task);
};

export const updateTask = async (req: Request, res: Response) => {
  const prev = await Task.findById(req.params.id);
  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  // إذا كان تم إنهاء المهمة وأُضيفت incentive، سجل قيد محاسبي
  if (updated?.status === 'completed' && updated.incentiveAmount && prev?.status !== 'completed') {
    await LedgerEntry.create({
      date: new Date(),
      description: `مكافأة إتمام مهمة: ${updated.title}`,
      debitAccount:  'Incentive Expense',
      creditAccount: 'Incentives Payable',
      amount: updated.incentiveAmount,
      refType: 'Task',
      refId: updated._id,
    });
  }
  res.json(updated);
};

export const deleteTask = async (req: Request, res: Response) => {
  await Task.findByIdAndDelete(req.params.id);
  res.status(204).send();
};
