// src/routes/admin/marketersRoutes.ts
import { Router } from "express";

import * as ctrl from "../../controllers/admin/marketers.controller";

const r = Router();

// كل المسارات هنا محمية أدمن

/**
 * GET /admin/marketers
 * ?q=...&status=active|suspended
 */
r.get("/", ctrl.list);

/**
 * POST /admin/marketers/invite
 * body: { fullName, phone, email?, password, team?, area?, city? }
 */
r.post("/invite", ctrl.invite);

/**
 * PATCH /admin/marketers/:id
 * body: أي حقول قابلة للتعديل (بدون password)
 */
r.patch("/:id", ctrl.patch);

/**
 * POST /admin/marketers/:id/status
 * body: { status: "active" | "suspended" }
 */
r.post("/:id/status", ctrl.setStatus);

/**
 * POST /admin/marketers/:id/reset-password
 * body: { password }
 */
r.post("/:id/reset-password", ctrl.resetPassword);

/**
 * DELETE /admin/marketers/:id
 */
r.delete("/:id", ctrl.softDelete);

export default r;
