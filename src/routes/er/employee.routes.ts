// server/src/routes/employee.routes.ts
import { Router } from 'express';
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../../controllers/er/employee.controller';

const router = Router();
router.get('/', getAllEmployees);
router.post('/', createEmployee);
router.patch('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);
export default router;