// server/src/routes/attendance.routes.ts
import { Router } from "express";
import {
  getAttendance,
  getTodayAttendance,
  getDeductions,
  recordAttendance,
} from "../../controllers/er/attendance.controller"; // تأكد أن المسار صحيح

const router = Router();

// سجلات الحضور (فلترة بـ employee اختياري)
router.get("/", getAttendance);

// حضور اليوم الحالي
router.get("/today", getTodayAttendance);

// خصومات الموظف (اختياري)
router.get("/deductions", getDeductions);

// تسجيل حضور/غياب
router.post("/", recordAttendance);

export default router;
