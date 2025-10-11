import { Router } from 'express';
import settlementRoutes from './settlement.routes';
import walletRoutes from './wallet.routes';
import reconciliationRoutes from './reconciliation.routes';
import commissionRoutes from './commission.routes';
import commissionSettingsRoutes from './commissionSettings.routes';
import couponRoutes from './coupon.routes';
import payoutRoutes from './payout.routes';
import reportsRoutes from './reports.routes';
import monitoringRoutes from './monitoring.routes';

const router = Router();

/**
 * @route /finance/settlements
 * @desc Settlement management routes
 */
router.use('/settlements', settlementRoutes);

/**
 * @route /finance/wallet
 * @desc Wallet management routes
 */
router.use('/wallet', walletRoutes);

/**
 * @route /finance/reconciliation
 * @desc Reconciliation reporting routes
 */
router.use('/reconciliation', reconciliationRoutes);

/**
 * @route /finance/commissions
 * @desc Commission management routes
 */
router.use('/commissions', commissionRoutes);

/**
 * @route /finance/commissions/settings
 * @desc Commission settings and advanced calculation routes
 */
router.use('/commissions', commissionSettingsRoutes);

/**
 * @route /finance/coupons
 * @desc Coupon management routes
 */
router.use('/coupons', couponRoutes);

/**
 * @route /finance/payouts
 * @desc Driver payout management routes
 */
router.use('/payouts', payoutRoutes);

/**
 * @route /finance/reports
 * @desc Daily and monthly report comparison routes
 */
router.use('/reports', reportsRoutes);

/**
 * @route /finance/monitoring
 * @desc Finance monitoring and health routes
 */
router.use('/monitoring', monitoringRoutes);

export default router;
