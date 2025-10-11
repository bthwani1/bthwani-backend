// src/routes/driver_app/driver.vacation.routes.ts

import express from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import {
  requestVacation,
  listMyVacations,
  approveVacation,
  rejectVacation
} from "../../controllers/driver_app/vacation.controller";

const router = express.Router();

router.post("/", authenticate, requestVacation);
router.get("/", authenticate, listMyVacations);

// مسارات للأدمن فقط
router.post("/:id/approve", authenticate, authorize(["admin", "super_admin"]), approveVacation);
router.post("/:id/reject", authenticate, authorize(["admin", "super_admin"]), rejectVacation);

export default router;
