import { Router } from "express";
import * as referralController from "../../controllers/field/referral.controller";

const router = Router();

// GET /api/v1/referrals/link - Generate or get referral link for marketer
router.get("/link", referralController.getReferralLink);

// POST /api/v1/referrals/track - Track referral clicks (public endpoint)
router.post("/track", referralController.trackReferral);

// GET /api/v1/referrals/stats - Get referral statistics for marketer
router.get("/stats", referralController.getReferralStats);

export default router;
