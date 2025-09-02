// server/src/routes/performanceGoal.routes.ts
import { Router } from 'express';
import {
  getGoals,
  createGoal,
  updateGoal,
} from '../../controllers/er/performanceGoal.controller';

const router = Router();
router.get('/', getGoals);
router.post('/', createGoal);
router.patch('/:id', updateGoal);
export default router;