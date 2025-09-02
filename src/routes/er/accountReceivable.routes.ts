// server/src/routes/accountReceivable.routes.ts
import { Router } from 'express';
import {
  getAllReceivables,
  getReceivableById,
  createReceivable,
  updateReceivable,
  deleteReceivable,
} from '../../controllers/er/accountReceivable.controller';

const router = Router();
router.get('/', getAllReceivables);
router.get('/:id', getReceivableById);
router.post('/', createReceivable);
router.patch('/:id', updateReceivable);
router.delete('/:id', deleteReceivable);
export default router;