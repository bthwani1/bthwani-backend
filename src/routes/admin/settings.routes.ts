// server/src/routes/admin/settings.routes.ts
import { Router } from 'express';
import {
  getAppearanceSettings,
  updateAppearanceSettings,
  getAllSettings,
  updateAllSettings,
} from '../../controllers/admin/settings.controller';
import { verifyFirebase } from '../../middleware/verifyFirebase';
import { verifyAdmin } from '../../middleware/verifyAdmin';

const router = Router();

// All routes require authentication and admin verification
router.use(verifyFirebase);
router.use(verifyAdmin);

// Appearance settings routes
router.get('/appearance', getAppearanceSettings);
router.put('/appearance', updateAppearanceSettings);

// General settings routes (for admin use)
router.get('/', getAllSettings);
router.put('/', updateAllSettings);

export default router;
