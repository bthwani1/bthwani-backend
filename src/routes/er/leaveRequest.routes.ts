// server/src/routes/leaveRequest.routes.ts
import { Router } from 'express';
import {
  getLeaves,
  createLeave,
  updateLeave,
} from '../../controllers/er/leaveRequest.controller';

const router = Router();
router.get('/', getLeaves);
router.post('/', createLeave);
router.patch('/:id', updateLeave);
export default router;