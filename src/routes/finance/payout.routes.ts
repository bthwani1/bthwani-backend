import { Router } from 'express';
import {
  generatePayoutBatchController,
  getPayoutBatchesController,
  getPayoutBatchDetailsController,
  processPayoutBatchController,
  exportPayoutBatchToCSVController,
  getWalletStatementController,
  exportWalletStatementToCSVController
} from '../../controllers/finance/payout.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  FinancePermission,
  financePermissionMiddleware,
  hasFinancePermission,
  ownWalletOnlyMiddleware
} from '../../middleware/finance.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route POST /finance/payouts/generate
 * @desc Generate new payout batch for drivers
 * @access FinanceAdmin, Ops
 */
router.post('/generate',
  financePermissionMiddleware(FinancePermission.CREATE_PAYOUT),
  generatePayoutBatchController
);

/**
 * @route GET /finance/payouts
 * @desc Get all payout batches with filtering and pagination
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/',
  financePermissionMiddleware(FinancePermission.READ_PAYOUT),
  getPayoutBatchesController
);

/**
 * @route GET /finance/payouts/:id
 * @desc Get payout batch details with items
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/:id',
  financePermissionMiddleware(FinancePermission.READ_PAYOUT),
  getPayoutBatchDetailsController
);

/**
 * @route PATCH /finance/payouts/:id/process
 * @desc Process payout batch (mark as paid)
 * @access FinanceAdmin, Ops
 */
router.patch('/:id/process',
  financePermissionMiddleware(FinancePermission.PROCESS_PAYOUT),
  processPayoutBatchController
);

/**
 * @route GET /finance/payouts/:id/export.csv
 * @desc Export payout batch to CSV for bank/PSP
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/:id/export.csv',
  financePermissionMiddleware(FinancePermission.EXPORT_PAYOUT),
  exportPayoutBatchToCSVController
);

/**
 * @route GET /finance/payouts/wallet-statement/:accountId
 * @desc Get wallet statement for an account
 * @access Own wallet: Driver/Vendor, All wallets: FinanceAdmin, Ops, Auditor
 */
router.get('/wallet-statement/:accountId',
  (req, res, next) => {
    const user = req.user as any;
    if (!hasFinancePermission(user, FinancePermission.READ_OWN_WALLET) &&
        !hasFinancePermission(user, FinancePermission.READ_ALL_WALLETS)) {
       res.status(403).json({
        error: { code: "INSUFFICIENT_PERMISSIONS", message: "Permission required: READ_OWN_WALLETS or READ_ALL_WALLETS" }
      });
      return;
    }
    next();
  },
  ownWalletOnlyMiddleware(),
  getWalletStatementController
);

/**
 * @route GET /finance/payouts/wallet-statement/:accountId/export.csv
 * @desc Export wallet statement to CSV
 * @access Own wallet: Driver/Vendor, All wallets: FinanceAdmin, Ops, Auditor
 */
router.get('/wallet-statement/:accountId/export.csv',
  financePermissionMiddleware(
    FinancePermission.EXPORT_WALLET_STATEMENT
  ),
  ownWalletOnlyMiddleware(),
  exportWalletStatementToCSVController
);

export default router;
