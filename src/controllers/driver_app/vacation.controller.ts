import { Request, Response } from "express";
import { WithdrawalRequest } from "../../models/Wallet_V8/WithdrawalRequest";
import VacationRequest from "../../models/Driver_app/VacationRequest";
import Order from "../../models/delivery_marketplace_v1/Order";
import mongoose from "mongoose";
import Driver from "../../models/Driver_app/driver";

// POST /driver/vacations
export const requestVacation = async (req: Request, res: Response) => {
  const driverId = req.user!.id;
  const { fromDate, toDate, reason } = req.body;
  const reqVac = await VacationRequest.create({
    driverId,
    fromDate,
    toDate,
    reason,
  });
  res.status(201).json(reqVac);
};
export const getAssignedOrders = async (req: Request, res: Response) => {
  try {
    const driverId = new mongoose.Types.ObjectId(req.user!.id);
    const orders = await Order.find({ driver: driverId })
      .sort({ assignedAt: -1 })
      .lean();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// 2. تقارير يومية/أسبوعية للمندوب
export const getDriverReports = async (req: Request, res: Response) => {
  try {
    const driverId = new mongoose.Types.ObjectId(req.user!.id);
    const period = req.query.period === "weekly" ? "weekly" : "daily";

    // تحديد بداية الفترة
    const now = new Date();
    let start: Date;
    if (period === "weekly") {
      start = new Date(now.setDate(now.getDate() - now.getDay()));
    } else {
      // daily
      start = new Date(now.setHours(0, 0, 0, 0));
    }

    // عدّ الطلبات المكتملة والملغاة
    const stats = await Order.aggregate([
      {
        $match: {
          driver: driverId,
          deliveredAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ period, since: start, stats });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
// GET /driver/vacations
export const listMyVacations = async (req: Request, res: Response) => {
  const driverId = req.user!.id;
  const { from, to, status } = req.query;

  // بناء فلتر البحث
  const filter: any = { driverId };

  if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
    filter.status = status;
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from as string);
    if (to) filter.createdAt.$lte = new Date(to as string);
  }

  const vacs = await VacationRequest.find(filter).sort({ createdAt: -1 });
  res.json(vacs);
};
export const getActiveDriversCount = async (_req: Request, res: Response) => {
  try {
    const count = await Driver.countDocuments({
      isAvailable: true,
      isBanned: false,
    });
    res.json({ activeDrivers: count });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
// PATCH /admin/vacations/:id/approve
export const approveVacation = async (req: Request, res: Response) => {
  const vac = await VacationRequest.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );
  res.json(vac);
};

// PATCH /admin/vacations/:id/reject
export const rejectVacation = async (req: Request, res: Response) => {
  const vac = await VacationRequest.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  );
  res.json(vac);
};
