import { Router } from 'express';
import {
  getWalletBalanceController,
  getWalletBalancesByTypeController,
  getSettlementBalanceController,
  getLedgerEntries,
  getLedgerEntryById
} from '../../controllers/finance/wallet.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  FinancePermission,
  financePermissionMiddleware,
  ownWalletOnlyMiddleware,
  hasFinancePermission
} from '../../middleware/finance.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route GET /finance/wallet/balance
 * @desc Get wallet balance for current user
 * @access Driver/Vendor (own wallet), FinanceAdmin/Ops/Auditor (all wallets)
 */
router.get('/balance',
  (req, res, next) => {
    const user = req.user as any;
    if (!hasFinancePermission(user, FinancePermission.READ_OWN_WALLET) &&
        !hasFinancePermission(user, FinancePermission.READ_ALL_WALLETS)) {
       res.status(403).json({
        error: { code: "INSUFFICIENT_PERMISSIONS", message: "Permission required: READ_OWN_WALLET or READ_ALL_WALLETS" }
      });
      return;
    }
    next();
  },
  ownWalletOnlyMiddleware(),
  getWalletBalanceController
);

/**
 * @route GET /finance/wallet/balances/:type
 * @desc Get wallet balances for all accounts of a specific type
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/balances/:type',
  financePermissionMiddleware(FinancePermission.READ_ALL_WALLETS),
  getWalletBalancesByTypeController
);

/**
 * @route GET /finance/wallet/settlement-balance/:type
 * @desc Get available balance for settlement eligibility
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/settlement-balance/:type',
  financePermissionMiddleware(FinancePermission.READ_ALL_WALLETS),
  getSettlementBalanceController
);

/**
 * @route GET /finance/ledger/entries
 * @desc Get ledger entries with filtering and pagination
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/ledger/entries',
  financePermissionMiddleware(FinancePermission.READ_LEDGER),
  getLedgerEntries
);

/**
 * @route GET /finance/ledger/entries/:id
 * @desc Get ledger entry by ID with splits
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/ledger/entries/:id',
  financePermissionMiddleware(FinancePermission.READ_LEDGER),
  getLedgerEntryById
);

export default router;
