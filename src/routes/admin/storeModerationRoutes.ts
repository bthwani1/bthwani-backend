import { Router } from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import * as s from "../../controllers/admin/storeModeration.controller";

const r = Router();

r.use(verifyFirebase);

r.get("/", s.list); 
r.get("/:id", s.getOne); // تفاصيل متجر

r.post("/:id/activate", s.activate); // isActive=true, forceClosed=false
r.post("/:id/deactivate", s.deactivate); // isActive=false
r.post("/:id/force-close", s.forceClose); // forceClosed=true
r.post("/:id/force-open", s.forceOpen); // forceClosed=false

// تحديث إداري للحقول الحساسة
r.patch("/:id", s.adminPatch);

// حذف (حسب السياسة: soft/hard)
r.delete("/:id", s.remove);

export default r;
