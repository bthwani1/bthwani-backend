// src/routes/field/onboarding.routes.ts
import { Router } from "express";
import { verifyMarketerJWT } from "../../middleware/verifyMarketerJWT";
import { getMyOnboarding } from "../../controllers/field/onboardingMy.controller";

const r = Router();
// حماية لمسارات المسوّقين بواسطة JWT التطبيق
r.get("/field/onboarding/my", verifyMarketerJWT, getMyOnboarding);
export default r;
