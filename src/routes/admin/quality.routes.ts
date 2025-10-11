// server/src/routes/admin/quality.routes.ts
import { Router } from 'express';
import {
  getQualityReviews,
  hideQualityReview,
  publishQualityReview,
  getQualityReview,
  getQualityStats,
} from '../../controllers/admin/quality.controller';
import { verifyFirebase } from '../../middleware/verifyFirebase';
import { verifyAdmin } from '../../middleware/verifyAdmin';

const router = Router();

// All routes require authentication and admin verification
router.use(verifyFirebase);
router.use(verifyAdmin);

// Get quality reviews with filtering and pagination
router.get('/reviews', getQualityReviews);

// Get quality statistics
router.get('/stats', getQualityStats);

// Get specific quality review
router.get('/reviews/:id', getQualityReview);

// Hide quality review
router.patch('/reviews/:id/hide', hideQualityReview);

// Publish quality review
router.patch('/reviews/:id/publish', publishQualityReview);

export default router;
