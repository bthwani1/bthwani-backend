// server/src/routes/performanceReview.routes.ts
import { Router } from 'express';
import { runReview, getReviews } from '../../controllers/er/performanceReview.controller';

const router = Router();
router.get('/',  getReviews);
router.post('/', runReview);
export default router;