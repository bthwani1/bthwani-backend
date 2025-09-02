// server/src/routes/kpiAssignment.routes.ts
import { Router } from 'express';
import { getKpis, createKpi, updateKpi, deleteKpi } from '../../controllers/er/kpiAssignment.controller';

const router = Router();
router.get('/',     getKpis);
router.post('/',    createKpi);
router.patch('/:id',updateKpi);
router.delete('/:id',deleteKpi);
export default router;