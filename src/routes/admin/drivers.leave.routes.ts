// server/src/routes/admin/drivers.leave.routes.ts
import { Router } from 'express';
import {
  getDriverLeaveRequests,
  getDriverLeaveRequest,
  createDriverLeaveRequest,
  updateDriverLeaveRequest,
  approveDriverLeaveRequest,
  rejectDriverLeaveRequest,
  deleteDriverLeaveRequest,
  getLeaveRequestStats,
} from '../../controllers/admin/drivers.leave.controller';
import { verifyFirebase } from '../../middleware/verifyFirebase';
import { verifyAdmin } from '../../middleware/verifyAdmin';

const router = Router();

// All routes require authentication and admin verification
router.use(verifyFirebase);
router.use(verifyAdmin);

// Get all leave requests with optional filters and pagination
router.get('/', getDriverLeaveRequests);

// Get leave request statistics
router.get('/stats', getLeaveRequestStats);

// Get specific leave request by ID
router.get('/:id', getDriverLeaveRequest);

// Create new leave request
router.post('/', createDriverLeaveRequest);

// Update leave request
router.patch('/:id', updateDriverLeaveRequest);

// Approve leave request
router.patch('/:id/approve', approveDriverLeaveRequest);

// Reject leave request
router.patch('/:id/reject', rejectDriverLeaveRequest);

// Delete leave request
router.delete('/:id', deleteDriverLeaveRequest);

export default router;
