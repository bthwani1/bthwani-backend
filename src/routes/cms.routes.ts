import { Router } from "express";
import * as CmsController from "../controllers/cms/CmsController";
import { getOnboarding } from "../controllers/cms/OnboardingPublicController";

const router = Router();

// Public bootstrap & pages
router.get("/bootstrap", CmsController.getBootstrap);
router.get("/pages/:slug", CmsController.getPage);
router.get("/onboarding", getOnboarding);

// (Optional) add admin CRUD routers per model later
export default router;
