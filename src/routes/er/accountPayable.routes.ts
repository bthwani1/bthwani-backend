// server/src/routes/accountPayable.routes.ts
import { Router } from 'express';
import {
  getAllPayables,
  getPayableById,
  createPayable,
  updatePayable,
  deletePayable,
} from '../../controllers/er/accountPayable.controller';

const router = Router();
router.get('/', getAllPayables);
router.get('/:id', getPayableById);
router.post('/', createPayable);
router.patch('/:id', updatePayable);
router.delete('/:id', deletePayable);
export default router;