import { Router } from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import * as c from "../../controllers/admin/commissionPlans.controller";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { audit } from "../../middleware/audit";

const r = Router();
/**
 * @swagger
 * tags:
 *  - name: Admin-CommissionPlans
 *    description: إدارة خطط الحوافز
 */
r.use(verifyFirebase, verifyAdmin);
r.get("/", c.list);
r.post("/", audit("commission:createPlan"), c.create);
r.patch("/:id", audit("commission:updatePlan"), c.patch);
r.post("/:id/status", audit("commission:updatePlanStatus"), c.setStatus);
r.delete("/:id", audit("commission:deletePlan"), c.remove);
export default r;
