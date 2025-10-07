// src/routes/admin/withdrawalAdminRoutes.ts

import express from "express";
import {
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from "../../controllers/admin/admin.withdrawal.controller";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";

const router = express.Router();



router.get("/", verifyFirebase, verifyAdmin, listWithdrawals);
router.patch("/:id/approve", verifyFirebase, verifyAdmin, approveWithdrawal);
router.patch("/:id/reject", verifyFirebase, verifyAdmin, rejectWithdrawal);

export default router;
