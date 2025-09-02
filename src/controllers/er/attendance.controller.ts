// server/src/controllers/attendance.controller.ts
import { Request, Response } from 'express';
import { Attendance } from '../../models/er/attendance.model';
import { Deduction } from '../../models/er/deduction.model';

export const getAttendance = async (req: Request, res: Response) => {
  const records = await Attendance.find({ employee: req.query.employee });
  res.json(records);
};

export const recordAttendance = async (req: Request, res: Response) => {
  const att = new Attendance(req.body);
  await att.save();
  // احتساب الخصم إذا كان الغياب
  if (att.status === 'absent') {
    const amount = 50; // أو استرجاع قيمة من الإعدادات
    const ded = new Deduction({
      employee: att.employee,
      date: att.date,
      amount,
      reason: 'غياب غير مبرر',
    });
    await ded.save();
  }
  res.status(201).json(att);
};