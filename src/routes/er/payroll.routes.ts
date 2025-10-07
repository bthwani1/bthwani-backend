// server/src/routes/er/payroll.routes.ts
import { Router } from "express";
import {
  getAllPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll,
  getPayrollStats,
  processPayroll,
} from "../../controllers/er/payroll.controller";

const router = Router();

router.get("/", getAllPayrolls);

// ضع المسارات الثابتة قبل /:id
router.get("/stats", getPayrollStats);
router.post("/process", processPayroll);

// قيِّد الـ id ليكون ObjectId صحيح
router.get("/:id([0-9a-fA-F]{24})", getPayrollById);
router.patch("/:id([0-9a-fA-F]{24})", updatePayroll);
router.delete("/:id([0-9a-fA-F]{24})", deletePayroll);

export default router;
