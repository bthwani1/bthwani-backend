import { Router } from "express";
import * as r from "../../controllers/admin/reports.marketers.controller";
import { verifyMarketerJWT } from "../../middleware/verifyMarketerJWT";

const x = Router();
/**
 * @swagger
 * tags:
 *  - name: Reports
 *    description: تقارير أداء المسوّقين
 */
x.use(verifyMarketerJWT);
x.get("/overview", r.overview);
x.get("/:id", r.perMarketer);
export default x;
