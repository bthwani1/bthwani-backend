// server/src/routes/admin/support.routes.ts
import { Router } from 'express';
import {
  getSupportTickets,
  getSupportTicket,
  createSupportTicket,
  updateSupportTicket,
  assignSupportTicket,
  addSupportMessage,
  getSupportStats,
} from '../../controllers/admin/support.controller';
import { verifyFirebase } from '../../middleware/verifyFirebase';
import { verifyAdmin } from '../../middleware/verifyAdmin';

const router = Router();

// All routes require authentication and admin verification
router.use(verifyFirebase);
router.use(verifyAdmin);

// Get support tickets with filtering and pagination
router.get('/tickets', getSupportTickets);

// Get support statistics
router.get('/stats', getSupportStats);

// Get specific support ticket with messages
router.get('/tickets/:id', getSupportTicket);

// Create new support ticket
router.post('/tickets', createSupportTicket);

// Update support ticket
router.patch('/tickets/:id', updateSupportTicket);

// Assign support ticket to agent/group
router.patch('/tickets/:id/assign', assignSupportTicket);

// Add message to support ticket
router.post('/tickets/:id/messages', addSupportMessage);

export default router;
