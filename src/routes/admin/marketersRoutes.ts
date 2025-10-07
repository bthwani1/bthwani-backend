// src/routes/admin/marketersRoutes.ts
import { Router } from "express";

import * as ctrl from "../../controllers/admin/marketers.controller";

const r = Router();

r.get("/", ctrl.list);


r.post("/invite", ctrl.invite);


r.patch("/:id", ctrl.patch);


r.post("/:id/status", ctrl.setStatus);


r.post("/:id/reset-password", ctrl.resetPassword);


r.delete("/:id", ctrl.softDelete);

export default r;
