import { Router } from 'express';
import {
  generateReconciliationReportController,
  validateLedgerBalanceController,
  generateDailyBalanceReportController
} from '../../controllers/finance/reconciliation.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  FinancePermission,
  financePermissionMiddleware
} from '../../middleware/finance.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route GET /finance/reconciliation/report
 * @desc Generate reconciliation report for a period
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/report',
  financePermissionMiddleware(FinancePermission.READ_RECONCILIATION),
  generateReconciliationReportController
);

/**
 * @route GET /finance/reconciliation/validate-balance
 * @desc Validate ledger balance for a period
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/validate-balance',
  financePermissionMiddleware(FinancePermission.VALIDATE_BALANCE),
  validateLedgerBalanceController
);

/**
 * @route GET /finance/reconciliation/daily-report/:date
 * @desc Generate daily balance report
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/daily-report/:date',
  financePermissionMiddleware(FinancePermission.READ_RECONCILIATION),
  generateDailyBalanceReportController
);

export default router;
