import { Router } from "express";
import * as Slides from "../../controllers/cms/OnboardingSlidesAdminController";

const r = Router();


r.get("/", Slides.list);
r.post("/", Slides.create);
r.put("/:id", Slides.update);
r.delete("/:id", Slides.remove);

export default r;
