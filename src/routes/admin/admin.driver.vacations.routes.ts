// src/routes/admin/admin.driver.vacations.routes.ts

import express from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import VacationRequest from "../../models/Driver_app/VacationRequest";

const router = express.Router();

// GET /admin/drivers/vacations - قائمة جميع طلبات الإجازات مع فلاتر
router.get("/", authenticate, authorize(["admin", "super_admin"]), async (req, res) => {
  try {
    const { from, to, status, driverId } = req.query;

    // بناء فلتر البحث
    const filter: any = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
      filter.status = status;
    }

    if (driverId) {
      filter.driverId = driverId;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from as string);
      if (to) filter.createdAt.$lte = new Date(to as string);
    }

    const vacations = await VacationRequest.find(filter)
      .populate('driverId', 'fullName phone email')
      .sort({ createdAt: -1 });

    res.json(vacations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /admin/drivers/vacations/stats - إحصائيات الإجازات
router.get("/stats", authenticate, authorize(["admin", "super_admin"]), async (req, res) => {
  try {
    const stats = await VacationRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach((stat: any) => {
      result[stat._id as keyof typeof result] = stat.count;
      result.total += stat.count;
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
