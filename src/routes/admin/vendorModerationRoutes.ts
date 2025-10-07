import { Router } from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import * as c from "../../controllers/admin/vendorModeration.controller";
import { verifyAdmin } from "../../middleware/verifyAdmin";

const r = Router();

r.use(verifyFirebase, verifyAdmin);

r.get("/", c.list);
r.get("/:id", c.getOne);
r.get("/stores/:storeId/vendors", c.listByStore);

r.post("/:id/activate", c.activate);
r.post("/:id/deactivate", c.deactivate);
r.patch("/:id", c.update);
r.post("/:id/reset-password", c.resetPassword);

r.delete("/:id", c.remove);

export default r;
