// src/routes/field/onboarding.routes.ts
import { Router } from "express";
import { verifyMarketerJWT } from "../../middleware/verifyMarketerJWT";
import { getMyOnboarding, getOneFlexible } from "../../controllers/field/onboardingMy.controller";

const r = Router();
// حماية لمسارات المسوّقين بواسطة JWT التطبيق
r.get("/my", verifyMarketerJWT, getMyOnboarding);
r.get("/:id", verifyMarketerJWT, getOneFlexible); // ← جديد

export default r;
