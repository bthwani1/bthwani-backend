// server/src/routes/attendance.routes.ts
import { Router } from 'express';
import {
  getAttendance,
  recordAttendance,
} from '../../controllers/er/attendance.controller';
import { Request, Response } from 'express';
import { Deduction } from '../../models/er/deduction.model';

const router = Router();
router.get('/', getAttendance);
router.get('/', async (req: Request, res: Response) => {
  const list = await Deduction.find({ employee: req.query.employee });
  res.json(list);
});
router.post('/', recordAttendance);
export default router;