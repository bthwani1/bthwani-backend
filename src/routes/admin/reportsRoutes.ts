import { Router } from "express";
import * as r from "../../controllers/admin/reports.marketers.controller";

const x = Router();

// Static routes should come before dynamic routes to avoid conflicts
x.get("/overview", r.overview);
// Dynamic route for specific marketer reports
x.get("/:id", r.perMarketer);
export default x;
