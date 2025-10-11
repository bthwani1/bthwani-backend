import { Router } from 'express';
import {
  createCommissionRuleController,
  getCommissionRules,
  calculateCommissionController,
  applyCommissionController,
  getCommissionReportController
} from '../../controllers/finance/commission.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  FinancePermission,
  financePermissionMiddleware
} from '../../middleware/finance.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route POST /finance/commissions/rules
 * @desc Create a new commission rule
 * @access FinanceAdmin only
 */
router.post('/rules',
  financePermissionMiddleware(FinancePermission.CREATE_COMMISSION_RULE),
  createCommissionRuleController
);

/**
 * @route GET /finance/commissions/rules
 * @desc Get all commission rules
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/rules',
  financePermissionMiddleware(FinancePermission.READ_COMMISSION_RULE),
  getCommissionRules
);

/**
 * @route POST /finance/commissions/calculate
 * @desc Calculate commission for an order (preview)
 * @access FinanceAdmin, Ops
 */
router.post('/calculate',
  financePermissionMiddleware(FinancePermission.CALCULATE_COMMISSION),
  calculateCommissionController
);

/**
 * @route POST /finance/commissions/apply
 * @desc Apply commission to an order
 * @access FinanceAdmin, Ops
 */
router.post('/apply',
  financePermissionMiddleware(FinancePermission.CREATE_LEDGER_ENTRY),
  applyCommissionController
);

/**
 * @route GET /finance/commissions/report
 * @desc Get commission report for a period
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/report',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  getCommissionReportController
);

export default router;
