// src/routes/field/onboarding.routes.ts
import { Router } from "express";
import { verifyMarketerJWT } from "../../middleware/verifyMarketerJWT";
import {
  getMyOnboarding,
  getOneFlexible,
  createOnboarding,
  updateOnboarding,
  submitOnboarding
} from "../../controllers/field/onboardingMy.controller";

const r = Router();
// حماية لمسارات المسوّقين بواسطة JWT التطبيق
r.get("/my", verifyMarketerJWT, getMyOnboarding);
r.get("/:id", verifyMarketerJWT, getOneFlexible); // ← جديد

// Create draft onboarding
r.post("/", verifyMarketerJWT, createOnboarding);

// Update onboarding
r.patch("/:id", verifyMarketerJWT, updateOnboarding);

// Submit onboarding for review
r.post("/:id/submit", verifyMarketerJWT, submitOnboarding);

export default r;
