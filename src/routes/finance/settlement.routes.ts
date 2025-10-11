import { Router } from 'express';
import {
  generateSettlementController,
  getSettlements,
  getSettlementById,
  markSettlementAsPaidController,
  exportSettlementToCSV
} from '../../controllers/finance/settlement.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  FinancePermission,
  financePermissionMiddleware,
  financeDeepLinkProtection,
  ownWalletOnlyMiddleware
} from '../../middleware/finance.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route POST /finance/settlements/generate
 * @desc Generate new settlement for drivers or vendors
 * @access FinanceAdmin only
 */
router.post('/generate',
  financePermissionMiddleware(FinancePermission.CREATE_SETTLEMENT),
  generateSettlementController
);

/**
 * @route GET /finance/settlements
 * @desc Get all settlements with filtering and pagination
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/',
  financePermissionMiddleware(FinancePermission.READ_SETTLEMENT),
  getSettlements
);

/**
 * @route GET /finance/settlements/:id
 * @desc Get settlement by ID with details
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/:id',
  financePermissionMiddleware(FinancePermission.READ_SETTLEMENT),
  getSettlementById
);

/**
 * @route PATCH /finance/settlements/:id/mark-paid
 * @desc Mark settlement as paid
 * @access FinanceAdmin, Ops
 */
router.patch('/:id/mark-paid',
  financePermissionMiddleware(FinancePermission.MARK_SETTLEMENT_PAID),
  markSettlementAsPaidController
);

/**
 * @route GET /finance/settlements/:id/export.csv
 * @desc Export settlement to CSV
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/:id/export.csv',
  financePermissionMiddleware(FinancePermission.EXPORT_SETTLEMENT),
  exportSettlementToCSV
);

export default router;
