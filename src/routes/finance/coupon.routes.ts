import { Router } from 'express';
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
  useCoupon,
  getCouponStats
} from '../../controllers/finance/coupon.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  FinancePermission,
  financePermissionMiddleware
} from '../../middleware/finance.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route GET /finance/coupons
 * @desc Get all coupons with filtering
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  getCoupons
);

/**
 * @route POST /finance/coupons
 * @desc Create a new coupon
 * @access FinanceAdmin only
 */
router.post('/',
  financePermissionMiddleware(FinancePermission.CREATE_LEDGER_ENTRY),
  createCoupon
);

/**
 * @route GET /finance/coupons/:id
 * @desc Get coupon by ID
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/:id',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  getCouponById
);

/**
 * @route PUT /finance/coupons/:id
 * @desc Update coupon
 * @access FinanceAdmin only
 */
router.put('/:id',
  financePermissionMiddleware(FinancePermission.CREATE_LEDGER_ENTRY),
  updateCoupon
);

/**
 * @route DELETE /finance/coupons/:id
 * @desc Delete coupon
 * @access FinanceAdmin only
 */
router.delete('/:id',
  financePermissionMiddleware(FinancePermission.CREATE_LEDGER_ENTRY),
  deleteCoupon
);

/**
 * @route PATCH /finance/coupons/:id/toggle
 * @desc Toggle coupon active status
 * @access FinanceAdmin only
 */
router.patch('/:id/toggle',
  financePermissionMiddleware(FinancePermission.CREATE_LEDGER_ENTRY),
  toggleCouponStatus
);

/**
 * @route POST /finance/coupons/validate
 * @desc Validate coupon for an order
 * @access FinanceAdmin, Ops, System (for order processing)
 */
router.post('/validate',
  validateCoupon
);

/**
 * @route POST /finance/coupons/:id/use
 * @desc Increment coupon usage count
 * @access System (for order processing)
 */
router.post('/:id/use',
  useCoupon
);

/**
 * @route GET /finance/coupons/:id/stats
 * @desc Get coupon statistics
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/:id/stats',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  getCouponStats
);

export default router;
