import { Router } from 'express';
import {
  getCurrentCommissionSettings,
  createCommissionSettings,
  updateCommissionSettings,
  getCommissionAuditLog,
  getCommissionSettingsHistory,
  calculateCommissionPreview
} from '../../controllers/finance/commissionSettings.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  FinancePermission,
  financePermissionMiddleware
} from '../../middleware/finance.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route GET /finance/commissions/settings
 * @desc Get current active commission settings
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/settings',
  financePermissionMiddleware(FinancePermission.READ_COMMISSION_RULE),
  getCurrentCommissionSettings
);

/**
 * @route POST /finance/commissions/settings
 * @desc Create new commission settings
 * @access FinanceAdmin only
 */
router.post('/settings',
  financePermissionMiddleware(FinancePermission.CREATE_COMMISSION_RULE),
  createCommissionSettings
);

/**
 * @route PUT /finance/commissions/settings/:id
 * @desc Update existing commission settings
 * @access FinanceAdmin only
 */
router.put('/settings/:id',
  financePermissionMiddleware(FinancePermission.CREATE_COMMISSION_RULE),
  updateCommissionSettings
);

/**
 * @route GET /finance/commissions/audit-log
 * @desc Get commission settings audit log
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/audit-log',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  getCommissionAuditLog
);

/**
 * @route GET /finance/commissions/settings/history
 * @desc Get commission settings history
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/settings/history',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  getCommissionSettingsHistory
);

/**
 * @route POST /finance/commissions/calculate-preview
 * @desc Calculate commission preview for an order
 * @access FinanceAdmin, Ops
 */
router.post('/calculate-preview',
  financePermissionMiddleware(FinancePermission.CALCULATE_COMMISSION),
  calculateCommissionPreview
);

export default router;
