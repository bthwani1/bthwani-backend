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
r.get("/", c.list);
r.post("/", c.create);
r.patch("/:id", c.patch);
r.post("/:id/status", c.setStatus);
r.delete("/:id", c.remove);
export default r;
