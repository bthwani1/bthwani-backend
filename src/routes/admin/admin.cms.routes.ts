import { Router } from "express";
import * as Slides from "../../controllers/cms/OnboardingSlidesAdminController";
// import { requireAdmin } from "../middlewares/auth"; // إن وُجد

const r = Router();

// r.use(requireAdmin); // فعّل عندك لو لازم

r.get("/admin/onboarding-slides", Slides.list);
r.post("/admin/onboarding-slides", Slides.create);
r.put("/admin/onboarding-slides/:id", Slides.update);
r.delete("/admin/onboarding-slides/:id", Slides.remove);

export default r;
