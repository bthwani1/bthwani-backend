import { Router } from "express";
import * as r from "../../controllers/admin/reports.marketers.controller";
import { verifyMarketerJWT } from "../../middleware/verifyMarketerJWT";

const x = Router();
/**
 * @swagger
 * tags:
 *  - name: Admin-Reports
 *    description: تقارير أداء المسوّقين
 */
x.use(verifyMarketerJWT);
x.get("reports/marketers/overview", r.overview);
x.get("reports/marketers/:id", r.perMarketer);
export default x;
