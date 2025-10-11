import { Router } from 'express';
import {
  getFinanceMetricsController,
  getFinanceAlertsController,
  runDailyFinanceChecksController,
  getFinanceHealthController,
  createFinanceAuditLogController
} from '../../controllers/finance/monitoring.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  FinancePermission,
  financePermissionMiddleware
} from '../../middleware/finance.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route GET /finance/monitoring/metrics
 * @desc Get finance system metrics
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/metrics',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  getFinanceMetricsController
);

/**
 * @route GET /finance/monitoring/alerts
 * @desc Get current finance alerts
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/alerts',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  getFinanceAlertsController
);

/**
 * @route POST /finance/monitoring/daily-checks
 * @desc Run daily finance checks manually
 * @access FinanceAdmin only
 */
router.post('/daily-checks',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  runDailyFinanceChecksController
);

/**
 * @route GET /finance/monitoring/health
 * @desc Get finance system health status
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/health',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  getFinanceHealthController
);

/**
 * @route POST /finance/monitoring/audit-log
 * @desc Create finance audit log entry
 * @access FinanceAdmin, Ops
 */
router.post('/audit-log',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  createFinanceAuditLogController
);

export default router;
