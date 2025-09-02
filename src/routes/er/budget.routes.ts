// server/src/routes/budget.routes.ts
import { Router } from 'express';
import {
  getAllBudgets,
  getBudgetByYear,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../../controllers/er/budget.controller';

const router = Router();
router.get('/', getAllBudgets);
router.get('/:year', getBudgetByYear);
router.post('/', createBudget);
router.patch('/:id', updateBudget);
router.delete('/:id', deleteBudget);
export default router;