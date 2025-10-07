import { Router } from "express";
import * as r from "../../controllers/admin/reports.marketers.controller";

const x = Router();

x.get("/overview", r.overview);
x.get("/:id", r.perMarketer);
export default x;
