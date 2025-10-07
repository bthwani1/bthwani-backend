// src/routes/admin/dashboardOverview.routes.ts
import { Router } from "express";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import {
  getAdminSummary,
  getAdminTimeseries,
  getAdminTop,
  getAdminAlerts,
  getAllRatings,
  getAllSupportTickets,
  updateSupportTicketStatus,
  addSupportTicketNote,
} from "../../controllers/admin/dashboard.controller";

const router = Router();
router.use(verifyAdmin);

router.get("/summary", getAdminSummary);
router.get("/timeseries", getAdminTimeseries);
router.get("/top", getAdminTop);
router.get("/alerts", getAdminAlerts);
router.get("/ratings", getAllRatings);
router.get("/support-tickets", getAllSupportTickets);
router.put("/support-tickets/:id/status", updateSupportTicketStatus);
router.post("/support-tickets/:id/notes", addSupportTicketNote);

export default router;
