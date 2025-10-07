// server/src/controllers/er/attendance.controller.ts
import { Request, Response } from "express";
import { Attendance } from "../../models/er/attendance.model";
import { Deduction } from "../../models/er/deduction.model";

export const getAttendance = async (req: Request, res: Response) => {
  const { employee } = req.query;
  const filter: Record<string, unknown> = {};
  if (typeof employee === "string") filter.employee = employee;
  const records = await Attendance.find(filter);
  res.json(records);
};

export const getTodayAttendance = async (req: Request, res: Response) => {
  const { employee } = req.query;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 00:00
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // غدًا 00:00

  const filter: Record<string, unknown> = { date: { $gte: start, $lt: end } };
  if (typeof employee === "string") filter.employee = employee;

  const today = await Attendance.find(filter);
  res.json(today);
};

export const getDeductions = async (req: Request, res: Response) => {
  const { employee } = req.query;
  const filter: Record<string, unknown> = {};
  if (typeof employee === "string") filter.employee = employee;

  const list = await Deduction.find(filter);
  res.json(list);
};

export const recordAttendance = async (req: Request, res: Response) => {
  const att = new Attendance(req.body);
  await att.save();

  if (att.status === "absent") {
    const amount = 50; // TODO: اجلبها من الإعدادات
    const ded = new Deduction({
      employee: att.employee,
      date: att.date,
      amount,
      reason: "غياب غير مبرر",
    });
    await ded.save();
  }
  res.status(201).json(att);
};
