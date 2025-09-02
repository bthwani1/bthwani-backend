import { Router } from 'express';
import {
  getAllPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll,
} from '../../controllers/er/payroll.controller';

const router = Router();
router.get('/', getAllPayrolls);
router.get('/:id', getPayrollById);
router.post('/', createPayroll);
router.patch('/:id', updatePayroll);
router.delete('/:id', deletePayroll);
export default router;