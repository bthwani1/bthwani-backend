import { Router } from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import * as c from "../../controllers/admin/onboarding.controller";

const r = Router();

r.use(verifyFirebase);

r.get("/queue", c.queue);
r.get("/:id", c.getOne);
r.post("/:id/approve", c.approve);
r.post("/:id/reject", c.reject);
r.post("/:id/needs-fix", c.needsFix);

export default r;
