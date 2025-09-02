// server/src/routes/dashboard.routes.ts
import { Router } from "express";
import {
  getFinancialOverview,
  getTaskStats,
  getEmployeePerformance,
  getPeriodReport,
} from "../../controllers/er/dashboard.controller";

const router = Router();
router.get("/financial", getFinancialOverview);
router.get("/tasks", getTaskStats);
router.get("/performance", getEmployeePerformance);
router.get("/report", getPeriodReport);
export default router;
