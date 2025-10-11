import { WalletAccount, WalletStatementLine, LedgerEntry, LedgerSplit } from '../../models/finance';
import DeliveryOrder from '../../models/delivery_marketplace_v1/Order';

export interface DailyReportComparison {
  date: Date;
  orders_total: number;
  orders_count: number;
  wallet_statement_total: number;
  wallet_statement_count: number;
  discrepancy: number;
  discrepancy_percentage: number;
  details: {
    orders: {
      total_gross: number;
      total_company_share: number;
      total_platform_share: number;
      total_delivery_fee: number;
      count: number;
    };
    wallet_statement: {
      total_credits: number;
      total_debits: number;
      net_amount: number;
      count: number;
    };
  };
}

/**
 * Generate daily report comparing orders vs wallet statement
 */
export async function generateDailyReportComparison(date: Date): Promise<DailyReportComparison> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Get orders data for the day
  const ordersData = await getDailyOrdersSummary(startOfDay, endOfDay);

  // 2. Get wallet statement data for the day
  const walletStatementData = await getDailyWalletStatementSummary(startOfDay, endOfDay);

  // 3. Calculate discrepancy
  const discrepancy = ordersData.total_gross - walletStatementData.net_amount;
  const discrepancy_percentage = ordersData.total_gross > 0
    ? (discrepancy / ordersData.total_gross) * 100
    : 0;

  return {
    date,
    orders_total: ordersData.total_gross,
    orders_count: ordersData.count,
    wallet_statement_total: walletStatementData.net_amount,
    wallet_statement_count: walletStatementData.count,
    discrepancy,
    discrepancy_percentage,
    details: {
      orders: ordersData,
      wallet_statement: walletStatementData
    }
  };
}

/**
 * Get daily orders summary
 */
async function getDailyOrdersSummary(startOfDay: Date, endOfDay: Date) {
  const orders = await DeliveryOrder.aggregate([
    {
      $match: {
        status: 'delivered',
        deliveredAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: null,
        total_gross: { $sum: { $add: ['$price', '$deliveryFee'] } },
        total_company_share: { $sum: '$companyShare' },
        total_platform_share: { $sum: '$platformShare' },
        total_delivery_fee: { $sum: '$deliveryFee' },
        count: { $sum: 1 }
      }
    }
  ]);

  const result = orders[0] || {
    total_gross: 0,
    total_company_share: 0,
    total_platform_share: 0,
    total_delivery_fee: 0,
    count: 0
  };

  return result;
}

/**
 * Get daily wallet statement summary
 */
async function getDailyWalletStatementSummary(startOfDay: Date, endOfDay: Date) {
  // Get all wallet statement lines for the day
  const statementLines = await WalletStatementLine.aggregate([
    {
      $match: {
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: null,
        total_credits: {
          $sum: {
            $cond: {
              if: { $eq: ['$side', 'credit'] },
              then: '$amount',
              else: 0
            }
          }
        },
        total_debits: {
          $sum: {
            $cond: {
              if: { $eq: ['$side', 'debit'] },
              then: '$amount',
              else: 0
            }
          }
        },
        count: { $sum: 1 }
      }
    }
  ]);

  const result = statementLines[0] || {
    total_credits: 0,
    total_debits: 0,
    count: 0
  };

  return {
    total_credits: result.total_credits,
    total_debits: result.total_debits,
    net_amount: result.total_credits - result.total_debits,
    count: result.count
  };
}

/**
 * Get detailed daily orders breakdown
 */
export async function getDailyOrdersDetails(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const orders = await DeliveryOrder.find({
    status: 'delivered',
    deliveredAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  })
    .populate('driver', 'fullName phone')
    .populate('subOrders.store', 'name')
    .sort({ deliveredAt: 1 });

  return orders.map(order => ({
    id: order._id,
    order_number: order._id.toString(),
    delivered_at: order.deliveredAt,
    customer_address: order.address.label,
    driver: order.driver ? {
      id: order.driver._id,
      name: (order.driver as any).fullName,
      phone: (order.driver as any).phone
    } : null,
    stores: order.subOrders.map(subOrder => ({
      id: subOrder.store._id,
      name: (subOrder.store as any).name,
      items: subOrder.items.length,
      store_share: subOrder.items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0)
    })),
    amounts: {
      subtotal: order.price,
      delivery_fee: order.deliveryFee,
      company_share: order.companyShare,
      platform_share: order.platformShare,
      total: order.price + order.deliveryFee
    }
  }));
}

/**
 * Get detailed wallet statement for a date
 */
export async function getDailyWalletStatementDetails(date: Date, accountId?: string) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let query: any = {
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  };

  if (accountId) {
    query.account_id = accountId;
  }

  const statementLines = await WalletStatementLine.find(query)
    .populate('entry_id')
    .populate('account_id')
    .sort({ date: 1 });

  return statementLines.map(line => ({
    id: line._id,
    date: line.date,
    memo: line.memo,
    ref_type: line.ref_type,
    ref_id: line.ref_id,
    side: line.side,
    amount: line.amount,
    balance_state: line.balance_state,
    running_balance: line.running_balance,
    entry: line.entry_id ? {
      id: line.entry_id._id,
      event_type: (line.entry_id as any).event_type,
      description: (line.entry_id as any).description
    } : null,
    account: line.account_id ? {
      id: line.account_id._id,
      owner_type: (line.account_id as any).owner_type,
      owner_id: (line.account_id as any).owner_id
    } : null
  }));
}

/**
 * Export daily comparison to CSV
 */
export async function exportDailyComparisonToCSV(date: Date): Promise<string> {
  const comparison = await generateDailyReportComparison(date);
  const ordersDetails = await getDailyOrdersDetails(date);
  const walletDetails = await getDailyWalletStatementDetails(date);

  // Headers for comparison summary
  const summaryHeaders = [
    'date',
    'orders_total',
    'orders_count',
    'wallet_statement_total',
    'wallet_statement_count',
    'discrepancy',
    'discrepancy_percentage'
  ];

  const summaryRows = [
    summaryHeaders.join(','),
    [
      date.toISOString().split('T')[0],
      comparison.orders_total,
      comparison.orders_count,
      comparison.wallet_statement_total,
      comparison.wallet_statement_count,
      comparison.discrepancy,
      comparison.discrepancy_percentage.toFixed(2) + '%'
    ].join(',')
  ];

  // Headers for orders details
  const ordersHeaders = [
    'order_id',
    'delivered_at',
    'customer_address',
    'driver_name',
    'driver_phone',
    'store_name',
    'store_items',
    'store_share',
    'subtotal',
    'delivery_fee',
    'company_share',
    'platform_share',
    'total_amount'
  ];

  const ordersDetailRows = [
    ordersHeaders.join(','),
    ...ordersDetails.map(order => [
      order.id,
      order.delivered_at?.toISOString(),
      `"${order.customer_address}"`,
      order.driver?.name || '',
      order.driver?.phone || '',
      order.stores.map(s => s.name).join('; '),
      order.stores.reduce((sum, s) => sum + s.items, 0),
      order.stores.reduce((sum, s) => sum + s.store_share, 0),
      order.amounts.subtotal,
      order.amounts.delivery_fee,
      order.amounts.company_share,
      order.amounts.platform_share,
      order.amounts.total
    ].join(','))
  ];

  // Headers for wallet statement details
  const walletHeaders = [
    'statement_id',
    'date',
    'memo',
    'ref_type',
    'ref_id',
    'side',
    'amount',
    'balance_state',
    'running_balance',
    'entry_event_type',
    'entry_description',
    'account_owner_type',
    'account_owner_id'
  ];

  const walletDetailRows = [
    walletHeaders.join(','),
    ...walletDetails.map(detail => [
      detail.id,
      detail.date?.toISOString(),
      `"${detail.memo}"`,
      detail.ref_type,
      detail.ref_id || '',
      detail.side,
      detail.amount,
      detail.balance_state,
      detail.running_balance,
      detail.entry?.event_type || '',
      detail.entry?.description || '',
      detail.account?.owner_type || '',
      detail.account?.owner_id || ''
    ].join(','))
  ];

  return [
    '=== DAILY COMPARISON SUMMARY ===',
    summaryRows.join('\n'),
    '',
    '=== ORDERS DETAILS ===',
    ordersDetailRows.join('\n'),
    '',
    '=== WALLET STATEMENT DETAILS ===',
    walletDetailRows.join('\n')
  ].join('\n');
}

/**
 * Generate monthly report comparison
 */
export async function generateMonthlyReportComparison(year: number, month: number) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const dailyComparisons: DailyReportComparison[] = [];

  // Generate comparison for each day of the month
  for (let day = 1; day <= endOfMonth.getDate(); day++) {
    const currentDate = new Date(year, month - 1, day);
    try {
      const comparison = await generateDailyReportComparison(currentDate);
      dailyComparisons.push(comparison);
    } catch (error) {
      console.error(`Error generating comparison for ${currentDate.toISOString()}:`, error);
    }
  }

  // Calculate monthly totals
  const monthlyTotals = dailyComparisons.reduce(
    (totals, daily) => ({
      orders_total: totals.orders_total + daily.orders_total,
      orders_count: totals.orders_count + daily.orders_count,
      wallet_statement_total: totals.wallet_statement_total + daily.wallet_statement_total,
      wallet_statement_count: totals.wallet_statement_count + daily.wallet_statement_count,
      discrepancy: totals.discrepancy + daily.discrepancy
    }),
    {
      orders_total: 0,
      orders_count: 0,
      wallet_statement_total: 0,
      wallet_statement_count: 0,
      discrepancy: 0
    }
  );

  return {
    month: `${year}-${month.toString().padStart(2, '0')}`,
    daily_comparisons: dailyComparisons,
    monthly_totals: monthlyTotals,
    total_days: dailyComparisons.length
  };
}
