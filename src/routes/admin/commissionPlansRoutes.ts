import { Router } from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import * as c from "../../controllers/admin/commissionPlans.controller";
import { verifyAdmin } from "../../middleware/verifyAdmin";

const r = Router();
/**
 * @swagger
 * tags:
 *  - name: Admin-CommissionPlans
 *    description: إدارة خطط الحوافز
 */
r.use(verifyFirebase, verifyAdmin);
r.get("/v1/commission-plans", c.list);
r.post("/v1/commission-plans", c.create);
r.patch("/v1/commission-plans/:id", c.patch);
r.post("/v1/commission-plans/:id/status", c.setStatus);
r.delete("/v1/commission-plans/:id", c.remove);
export default r;
