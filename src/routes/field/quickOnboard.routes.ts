import { Router } from "express";
import { quickOnboard } from "../../controllers/field/quickOnboard.controller";
import { verifyMarketerJWT } from "../../middleware/verifyMarketerJWT";

const router = Router();
router.post("/quick-onboard", verifyMarketerJWT, quickOnboard);
export default router;
