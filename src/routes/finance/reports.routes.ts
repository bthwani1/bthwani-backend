import { Router } from 'express';
import {
  generateDailyReportComparisonController,
  getDailyOrdersDetailsController,
  getDailyWalletStatementDetailsController,
  exportDailyComparisonToCSVController,
  generateMonthlyReportComparisonController
} from '../../controllers/finance/daily-report.controller';
import {
  exportSalesReport,
  exportPayoutsReport,
  exportOrdersReport,
  exportFeesTaxesReport,
  exportRefundsReport,
  getDataSummary,
  validateDataConsistency
} from '../../controllers/finance/reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  FinancePermission,
  financePermissionMiddleware
} from '../../middleware/finance.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route GET /finance/reports/daily-comparison/:date
 * @desc Generate daily report comparison between orders and wallet statement
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/daily-comparison/:date',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  generateDailyReportComparisonController
);

/**
 * @route GET /finance/reports/daily-orders/:date
 * @desc Get detailed daily orders for a specific date
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/daily-orders/:date',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  getDailyOrdersDetailsController
);

/**
 * @route GET /finance/reports/daily-wallet-statement/:date
 * @desc Get detailed wallet statement for a specific date
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/daily-wallet-statement/:date',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  getDailyWalletStatementDetailsController
);

/**
 * @route GET /finance/reports/daily-comparison/:date/export.csv
 * @desc Export daily comparison to CSV
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/daily-comparison/:date/export.csv',
  financePermissionMiddleware(FinancePermission.EXPORT_REPORTS),
  exportDailyComparisonToCSVController
);

/**
 * @route GET /finance/reports/monthly-comparison/:year/:month
 * @desc Generate monthly report comparison
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/monthly-comparison/:year/:month',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  generateMonthlyReportComparisonController
);

/**
 * تصدير تقرير المبيعات
 * GET /finance/reports/sales/export
 * Query parameters: startDate, endDate, storeId, status, format
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/sales/export',
  financePermissionMiddleware(FinancePermission.EXPORT_REPORTS),
  exportSalesReport
);

/**
 * تصدير تقرير المدفوعات
 * GET /finance/reports/payouts/export
 * Query parameters: startDate, endDate, status, format
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/payouts/export',
  financePermissionMiddleware(FinancePermission.EXPORT_REPORTS),
  exportPayoutsReport
);

/**
 * تصدير تقرير الطلبات
 * GET /finance/reports/orders/export
 * Query parameters: startDate, endDate, status, storeId, format
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/orders/export',
  financePermissionMiddleware(FinancePermission.EXPORT_REPORTS),
  exportOrdersReport
);

/**
 * تصدير تقرير الرسوم والضرائب
 * GET /finance/reports/fees-taxes/export
 * Query parameters: startDate, endDate, type, format
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/fees-taxes/export',
  financePermissionMiddleware(FinancePermission.EXPORT_REPORTS),
  exportFeesTaxesReport
);

/**
 * تصدير تقرير المرتجعات
 * GET /finance/reports/refunds/export
 * Query parameters: startDate, endDate, status, format
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/refunds/export',
  financePermissionMiddleware(FinancePermission.EXPORT_REPORTS),
  exportRefundsReport
);

/**
 * جلب ملخص البيانات للمقارنة مع الشاشات
 * GET /finance/reports/data-summary
 * Query parameters: startDate, endDate, reportType, storeId, status
 * @access FinanceAdmin, Ops, Auditor
 */
router.get('/data-summary',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  getDataSummary
);

/**
 * فحص مطابقة البيانات بين الشاشة والملف المصدر
 * POST /finance/reports/validate-consistency
 * Body: reportType, startDate, endDate, uiTotal, uiCount, storeId, status
 * @access FinanceAdmin, Ops, Auditor
 */
router.post('/validate-consistency',
  financePermissionMiddleware(FinancePermission.READ_REPORTS),
  validateDataConsistency
);

export default router;
