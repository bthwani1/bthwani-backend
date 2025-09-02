// server/src/routes/task.routes.ts
import { Router } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../../controllers/er/task.controller';

const router = Router();
router.get('/',      getAllTasks);
router.get('/:id',   getTaskById);
router.post('/',     createTask);
router.patch('/:id', updateTask);
router.delete('/:id',deleteTask);

export default router;
