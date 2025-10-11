/**
 * Financial Queries for Commission and Revenue Validation
 *
 * This file contains SQL queries and functions to verify financial calculations
 * for commission settings, order breakdowns, and revenue reconciliation.
 */

import { LedgerEntry, LedgerSplit, CommissionSettings } from '../../models/finance';

/**
 * إجمالي المنصة من طلب محدد
 * SELECT ROUND(SUM(platform_items_fee + platform_delivery_fee - platform_marketing_cost), 2) AS platform_net
 * FROM finance_ledger WHERE order_id = :orderId;
 */
export async function getPlatformNetRevenue(orderId: string): Promise<number> {
  const result = await LedgerEntry.aggregate([
    {
      $match: {
        event_ref: orderId,
        event_type: { $in: ['order_commission', 'order_coupon', 'order_tax'] }
      }
    },
    {
      $lookup: {
        from: 'ledgersplits',
        localField: '_id',
        foreignField: 'entry_id',
        as: 'splits'
      }
    },
    {
      $unwind: '$splits'
    },
    {
      $match: {
        'splits.account_type': { $in: ['platform_revenue', 'marketing_expense'] }
      }
    },
    {
      $group: {
        _id: null,
        platform_items_fee: {
          $sum: {
            $cond: [
              { $eq: ['$splits.account_type', 'platform_revenue'] },
              { $multiply: ['$splits.amount', 1] },
              0
            ]
          }
        },
        platform_delivery_fee: {
          $sum: {
            $cond: [
              { $eq: ['$splits.account_type', 'platform_revenue'] },
              { $multiply: ['$splits.amount', 1] },
              0
            ]
          }
        },
        platform_marketing_cost: {
          $sum: {
            $cond: [
              { $eq: ['$splits.account_type', 'marketing_expense'] },
              { $multiply: ['$splits.amount', -1] },
              0
            ]
          }
        }
      }
    }
  ]);

  const data = result[0] || { platform_items_fee: 0, platform_delivery_fee: 0, platform_marketing_cost: 0 };
  return Math.round((data.platform_items_fee + data.platform_delivery_fee - data.platform_marketing_cost) * 100) / 100;
}

/**
 * حصة المتجر من طلب محدد
 * SELECT ROUND(SUM(vendor_payout), 2) AS vendor_payout
 * FROM vendor_payouts WHERE order_id = :orderId;
 */
export async function getVendorPayout(orderId: string): Promise<number> {
  const result = await LedgerEntry.aggregate([
    {
      $match: {
        event_ref: orderId,
        event_type: { $in: ['order_commission', 'order_coupon'] }
      }
    },
    {
      $lookup: {
        from: 'ledgersplits',
        localField: '_id',
        foreignField: 'entry_id',
        as: 'splits'
      }
    },
    {
      $unwind: '$splits'
    },
    {
      $match: {
        'splits.account_type': 'vendor_wallet'
      }
    },
    {
      $group: {
        _id: null,
        vendor_payout: { $sum: '$splits.amount' }
      }
    }
  ]);

  return Math.round((result[0]?.vendor_payout || 0) * 100) / 100;
}

/**
 * حصة السائق من طلب محدد
 * SELECT ROUND(SUM(driver_payout), 2) AS driver_payout
 * FROM driver_payouts WHERE order_id = :orderId;
 */
export async function getDriverPayout(orderId: string): Promise<number> {
  const result = await LedgerEntry.aggregate([
    {
      $match: {
        event_ref: orderId,
        event_type: { $in: ['order_commission', 'order_tip'] }
      }
    },
    {
      $lookup: {
        from: 'ledgersplits',
        localField: '_id',
        foreignField: 'entry_id',
        as: 'splits'
      }
    },
    {
      $unwind: '$splits'
    },
    {
      $match: {
        'splits.account_type': 'driver_wallet'
      }
    },
    {
      $group: {
        _id: null,
        driver_payout: { $sum: '$splits.amount' }
      }
    }
  ]);

  return Math.round((result[0]?.driver_payout || 0) * 100) / 100;
}

/**
 * تقرير مفصل للطلب يتضمن جميع التفاصيل المالية
 */
export async function getOrderFinancialBreakdown(orderId: string) {
  const [platformRevenue, vendorPayout, driverPayout] = await Promise.all([
    getPlatformNetRevenue(orderId),
    getVendorPayout(orderId),
    getDriverPayout(orderId)
  ]);

  // Get order details from delivery order model
  const orderDetails = await require('../../models/delivery_marketplace_v1/Order').default.findOne({ _id: orderId });

  if (!orderDetails) {
    throw new Error('Order not found');
  }

  // Get current commission settings
  const currentSettings = await CommissionSettings.findOne({
    isActive: true,
    effectiveFrom: { $lte: new Date() }
  }).sort({ version: -1 });

  if (!currentSettings) {
    throw new Error('No active commission settings found');
  }

  const rates = currentSettings.rates;

  // Calculate expected values based on current settings
  const itemsAmount = orderDetails.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const deliveryFee = orderDetails.deliveryFee || 0;
  const tipAmount = orderDetails.tipAmount || 0;
  const couponAmount = orderDetails.coupon?.value || 0;

  // Vendor calculations
  const vendorCommission = (itemsAmount - couponAmount) * (rates.vendorCommission / 100);
  const expectedVendorPayout = itemsAmount - couponAmount - vendorCommission;

  // Driver calculations
  const driverDeliveryShare = deliveryFee * (rates.driverDeliveryShare / 100);
  const expectedDriverPayout = driverDeliveryShare + tipAmount; // Tip goes fully to driver

  // Platform calculations
  const platformItemsCommission = (itemsAmount - couponAmount) * (rates.platformItemsCommission / 100);
  const platformDeliveryCommission = deliveryFee * (rates.platformDeliveryCommission / 100);
  const expectedPlatformRevenue = platformItemsCommission + platformDeliveryCommission - couponAmount; // Platform funds the coupon

  return {
    orderId,
    orderDetails: {
      itemsAmount,
      deliveryFee,
      tipAmount,
      couponAmount,
      couponFundedBy: orderDetails.coupon?.fundedBy || 'platform',
      totalOrderValue: itemsAmount + deliveryFee + tipAmount
    },
    commissionSettings: {
      version: currentSettings.version,
      platformItemsCommission: rates.platformItemsCommission,
      platformDeliveryCommission: rates.platformDeliveryCommission,
      driverDeliveryShare: rates.driverDeliveryShare,
      vendorCommission: rates.vendorCommission,
      tipsDistribution: rates.tipsDistribution,
      taxEnabled: rates.taxEnabled,
      taxRate: rates.taxRate,
    },
    actual: {
      platformRevenue,
      vendorPayout,
      driverPayout,
      totalDistributed: platformRevenue + vendorPayout + driverPayout
    },
    expected: {
      platformRevenue: expectedPlatformRevenue,
      vendorPayout: expectedVendorPayout,
      driverPayout: expectedDriverPayout,
      totalExpected: expectedPlatformRevenue + expectedVendorPayout + expectedDriverPayout
    },
    variance: {
      platformVariance: platformRevenue - expectedPlatformRevenue,
      vendorVariance: vendorPayout - expectedVendorPayout,
      driverVariance: driverPayout - expectedDriverPayout,
      totalVariance: (platformRevenue + vendorPayout + driverPayout) - (expectedPlatformRevenue + expectedVendorPayout + expectedDriverPayout)
    }
  };
}

/**
 * تقرير يومي للمطابقة المالية
 */
export async function getDailyFinancialReconciliation(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const orders = await require('../../models/delivery_marketplace_v1/Order').default.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
    status: 'delivered'
  });

  let totalOrderValue = 0;
  let totalPlatformRevenue = 0;
  let totalVendorPayout = 0;
  let totalDriverPayout = 0;
  const orderBreakdowns = [];

  for (const order of orders) {
    try {
      const breakdown = await getOrderFinancialBreakdown(order._id);
      totalOrderValue += breakdown.orderDetails.totalOrderValue;
      totalPlatformRevenue += breakdown.actual.platformRevenue;
      totalVendorPayout += breakdown.actual.vendorPayout;
      totalDriverPayout += breakdown.actual.driverPayout;
      orderBreakdowns.push(breakdown);
    } catch (error) {
      console.warn(`Could not process order ${order._id}:`, error);
    }
  }

  return {
    date,
    summary: {
      totalOrders: orders.length,
      totalOrderValue: Math.round(totalOrderValue * 100) / 100,
      totalPlatformRevenue: Math.round(totalPlatformRevenue * 100) / 100,
      totalVendorPayout: Math.round(totalVendorPayout * 100) / 100,
      totalDriverPayout: Math.round(totalDriverPayout * 100) / 100,
      netPlatformProfit: Math.round((totalPlatformRevenue - totalVendorPayout - totalDriverPayout) * 100) / 100
    },
    orderBreakdowns,
    reconciliation: {
      orderValueMatchesDistribution: Math.abs(totalOrderValue - (totalPlatformRevenue + totalVendorPayout + totalDriverPayout)) < 0.01,
      hasVariance: orderBreakdowns.some(b => Math.abs(b.variance.totalVariance) > 0.01)
    }
  };
}

/**
 * تقرير أداء الإعدادات المالية
 */
export async function getCommissionSettingsPerformance(startDate: Date, endDate: Date) {
  const settings = await CommissionSettings.find({
    effectiveFrom: { $gte: startDate, $lte: endDate }
  }).sort({ effectiveFrom: 1 });

  const performanceData = [];

  for (const setting of settings) {
    const settingStart = setting.effectiveFrom;
    const settingEnd = setting.effectiveTo || endDate;

    const orders = await require('../../models/delivery_marketplace_v1/Order').default.find({
      createdAt: { $gte: settingStart, $lte: settingEnd },
      status: 'delivered'
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    for (const order of orders) {
      try {
        const breakdown = await getOrderFinancialBreakdown(order._id);
        totalRevenue += breakdown.actual.platformRevenue;
        totalCost += breakdown.actual.vendorPayout + breakdown.actual.driverPayout;
        totalProfit += breakdown.actual.platformRevenue - (breakdown.actual.vendorPayout + breakdown.actual.driverPayout);
      } catch (error) {
        console.warn(`Could not process order ${order._id} for settings performance:`, error);
      }
    }

    performanceData.push({
      settingsVersion: setting.version,
      effectiveFrom: setting.effectiveFrom,
      effectiveTo: setting.effectiveTo,
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      profitMargin: orders.length > 0 ? Math.round((totalProfit / totalRevenue) * 100 * 100) / 100 : 0,
      averageOrderValue: orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0
    });
  }

  return performanceData;
}

/**
 * فحص سلامة البيانات المالية
 */
export async function validateFinancialDataIntegrity(orderId?: string) {
  const matchCondition = orderId ? { event_ref: orderId } : {};

  const issues = [];

  // Check for unbalanced ledger entries
  const unbalancedEntries = await LedgerEntry.aggregate([
    { $match: matchCondition },
    {
      $lookup: {
        from: 'ledgersplits',
        localField: '_id',
        foreignField: 'entry_id',
        as: 'splits'
      }
    },
    {
      $project: {
        entryId: '$_id',
        totalDebit: '$total_debit',
        totalCredit: '$total_credit',
        isBalanced: '$is_balanced',
        splitsCount: { $size: '$splits' },
        calculatedDebit: {
          $sum: {
            $map: {
              input: '$splits',
              as: 'split',
              in: { $cond: [{ $eq: ['$$split.side', 'debit'] }, '$$split.amount', 0] }
            }
          }
        },
        calculatedCredit: {
          $sum: {
            $map: {
              input: '$splits',
              as: 'split',
              in: { $cond: [{ $eq: ['$$split.side', 'credit'] }, '$$split.amount', 0] }
            }
          }
        }
      }
    },
    {
      $match: {
        $or: [
          { $expr: { $ne: ['$total_debit', '$calculated_debit'] } },
          { $expr: { $ne: ['$total_credit', '$calculated_credit'] } },
          { isBalanced: false }
        ]
      }
    }
  ]);

  if (unbalancedEntries.length > 0) {
    issues.push({
      type: 'unbalanced_ledger_entries',
      count: unbalancedEntries.length,
      entries: unbalancedEntries.map(e => ({
        entryId: e.entryId,
        expectedDebit: e.total_debit,
        actualDebit: e.calculated_debit,
        expectedCredit: e.total_credit,
        actualCredit: e.calculated_credit
      }))
    });
  }

  // Check for negative balances (if applicable)
  const negativeBalances = await LedgerSplit.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$account_type',
        totalAmount: { $sum: { $multiply: ['$amount', { $cond: [{ $eq: ['$side', 'credit'] }, 1, -1] }] } }
      }
    },
    { $match: { totalAmount: { $lt: 0 } } }
  ]);

  if (negativeBalances.length > 0) {
    issues.push({
      type: 'negative_balances',
      accounts: negativeBalances.map(b => ({
        accountType: b._id,
        balance: b.totalAmount
      }))
    });
  }

  // Check for orphaned ledger entries (entries without splits)
  const orphanedEntries = await LedgerEntry.aggregate([
    { $match: matchCondition },
    {
      $lookup: {
        from: 'ledgersplits',
        localField: '_id',
        foreignField: 'entry_id',
        as: 'splits'
      }
    },
    { $match: { splits: { $size: 0 } } }
  ]);

  if (orphanedEntries.length > 0) {
    issues.push({
      type: 'orphaned_ledger_entries',
      count: orphanedEntries.length,
      entries: orphanedEntries.map(e => e._id)
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    totalIssues: issues.length
  };
}

/**
 * استعلامات مساعدة للاختبار والتحقق
 */
export const FINANCIAL_QUERIES = {
  // فحص طلب واحد
  SINGLE_ORDER_CHECK: `
    SELECT
      o._id as order_id,
      o.total_amount,
      o.delivery_fee,
      o.tip_amount,
      o.coupon_code,

      -- حسابات المنصة
      (o.total_amount * cs.platform_items_commission / 100) as platform_items_fee,
      (o.delivery_fee * cs.platform_delivery_commission / 100) as platform_delivery_fee,
      CASE WHEN o.coupon_funded_by = 'platform' THEN o.coupon_amount ELSE 0 END as platform_coupon_cost,

      -- حسابات المتجر
      (o.total_amount * cs.vendor_commission / 100) as vendor_commission,
      (o.total_amount - (o.total_amount * cs.vendor_commission / 100) - o.coupon_amount) as vendor_payout,

      -- حسابات السائق
      (o.delivery_fee * cs.driver_delivery_share / 100) as driver_delivery_share,
      o.tip_amount as driver_tip,

      -- الإجماليات
      ((o.total_amount * cs.platform_items_commission / 100) +
       (o.delivery_fee * cs.platform_delivery_commission / 100) -
       CASE WHEN o.coupon_funded_by = 'platform' THEN o.coupon_amount ELSE 0 END) as platform_net,

      ((o.total_amount - (o.total_amount * cs.vendor_commission / 100) - o.coupon_amount) +
       (o.delivery_fee * cs.driver_delivery_share / 100) +
       o.tip_amount) as total_distributed

    FROM orders o
    CROSS JOIN commission_settings cs
    WHERE o._id = ?
    AND cs.is_active = true
    AND o.created_at >= cs.effective_from
    AND (o.created_at <= cs.effective_to OR cs.effective_to IS NULL);
  `,

  // فحص يومي
  DAILY_RECONCILIATION: `
    SELECT
      DATE(o.created_at) as order_date,
      COUNT(*) as total_orders,
      SUM(o.total_amount) as total_items_value,
      SUM(o.delivery_fee) as total_delivery_fees,
      SUM(o.tip_amount) as total_tips,
      SUM(o.coupon_amount) as total_coupon_amount,

      -- حسابات المنصة
      SUM(o.total_amount * cs.platform_items_commission / 100) as total_platform_items_fee,
      SUM(o.delivery_fee * cs.platform_delivery_commission / 100) as total_platform_delivery_fee,
      SUM(CASE WHEN o.coupon_funded_by = 'platform' THEN o.coupon_amount ELSE 0 END) as total_platform_coupon_cost,

      -- حسابات المتجر والسائق
      SUM(o.total_amount * cs.vendor_commission / 100) as total_vendor_commission,
      SUM(o.delivery_fee * cs.driver_delivery_share / 100) as total_driver_delivery_share,

      -- الإجماليات النهائية
      (SUM(o.total_amount * cs.platform_items_commission / 100) +
       SUM(o.delivery_fee * cs.platform_delivery_commission / 100) -
       SUM(CASE WHEN o.coupon_funded_by = 'platform' THEN o.coupon_amount ELSE 0 END)) as total_platform_net,

      (SUM(o.total_amount - (o.total_amount * cs.vendor_commission / 100) - o.coupon_amount) +
       SUM(o.delivery_fee * cs.driver_delivery_share / 100) +
       SUM(o.tip_amount)) as total_distributed

    FROM orders o
    CROSS JOIN commission_settings cs
    WHERE DATE(o.created_at) = ?
    AND o.status = 'delivered'
    AND cs.is_active = true
    GROUP BY DATE(o.created_at);
  `,

  // فحص تطابق القيم
  CONSISTENCY_CHECK: `
    SELECT
      o._id,
      ABS(
        (o.total_amount + o.delivery_fee + o.tip_amount) -
        (platform_calculated + vendor_calculated + driver_calculated)
      ) as variance,
      CASE WHEN ABS(
        (o.total_amount + o.delivery_fee + o.tip_amount) -
        (platform_calculated + vendor_calculated + driver_calculated)
      ) > 0.01 THEN 'MISMATCH' ELSE 'OK' END as status

    FROM (
      SELECT
        o._id,
        o.total_amount,
        o.delivery_fee,
        o.tip_amount,

        -- حساب المنصة
        (o.total_amount * cs.platform_items_commission / 100 +
         o.delivery_fee * cs.platform_delivery_commission / 100 -
         CASE WHEN o.coupon_funded_by = 'platform' THEN o.coupon_amount ELSE 0 END) as platform_calculated,

        -- حساب المتجر
        (o.total_amount - (o.total_amount * cs.vendor_commission / 100) - o.coupon_amount) as vendor_calculated,

        -- حساب السائق
        (o.delivery_fee * cs.driver_delivery_share / 100 + o.tip_amount) as driver_calculated

      FROM orders o
      CROSS JOIN commission_settings cs
      WHERE cs.is_active = true
      AND o.created_at >= cs.effective_from
      AND (o.created_at <= cs.effective_to OR cs.effective_to IS NULL)
    ) calculations;
  `
};

export default {
  getPlatformNetRevenue,
  getVendorPayout,
  getDriverPayout,
  getOrderFinancialBreakdown,
  getDailyFinancialReconciliation,
  getCommissionSettingsPerformance,
  validateFinancialDataIntegrity,
  FINANCIAL_QUERIES
};
