import { Router } from 'express';
import {
  getAllEntries,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../../controllers/er/ledgerEntry.controller';

const router = Router();
router.get('/', getAllEntries);
router.get('/:id', getEntryById);
router.post('/', createEntry);
router.patch('/:id', updateEntry);
router.delete('/:id', deleteEntry);
export default router;