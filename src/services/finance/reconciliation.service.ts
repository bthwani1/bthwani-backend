import { Settlement, LedgerEntry, LedgerSplit, WalletAccount } from '../../models/finance';
import DeliveryOrder from '../../models/delivery_marketplace_v1/Order';

export interface ReconciliationReport {
  period_start: Date;
  period_end: Date;
  orders_total: number;
  wallet_movements_total: number;
  settlements_total: number;
  discrepancies: {
    orders_vs_wallet: number;
    wallet_vs_settlements: number;
    orders_vs_settlements: number;
  };
  notes: string[];
}

export interface ReconciliationSection {
  description: string;
  amount: number;
  details: any[];
}

/**
 * Generate reconciliation report for a given period
 */
export async function generateReconciliationReport(
  period_start: Date,
  period_end: Date,
  entity_type?: 'driver' | 'vendor'
): Promise<ReconciliationReport> {
  const notes: string[] = [];

  // 1. Calculate orders total (net amounts owed to drivers/vendors + company share)
  const ordersSection = await calculateOrdersTotal(period_start, period_end, entity_type);

  // 2. Calculate wallet movements (available balance changes during period)
  const walletSection = await calculateWalletMovements(period_start, period_end, entity_type);

  // 3. Calculate settlements total (net amounts paid during period)
  const settlementsSection = await calculateSettlementsTotal(period_start, period_end, entity_type);

  // Calculate discrepancies
  const discrepancies = {
    orders_vs_wallet: ordersSection.amount - walletSection.amount,
    wallet_vs_settlements: walletSection.amount - settlementsSection.amount,
    orders_vs_settlements: ordersSection.amount - settlementsSection.amount
  };

  return {
    period_start,
    period_end,
    orders_total: ordersSection.amount,
    wallet_movements_total: walletSection.amount,
    settlements_total: settlementsSection.amount,
    discrepancies,
    notes
  };
}

/**
 * Calculate total from orders during the period
 */
async function calculateOrdersTotal(
  period_start: Date,
  period_end: Date,
  entity_type?: 'driver' | 'vendor'
): Promise<ReconciliationSection> {
  let matchConditions: any = {
    status: 'delivered',
    deliveredAt: {
      $gte: period_start,
      $lte: period_end
    }
  };

  if (entity_type === 'driver') {
    matchConditions.driver = { $exists: true, $ne: null };
  } else if (entity_type === 'vendor') {
    matchConditions['subOrders.store'] = { $exists: true, $ne: null };
  }

  const orders = await DeliveryOrder.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalCompanyShare: { $sum: '$companyShare' },
        totalPlatformShare: { $sum: '$platformShare' },
        totalDeliveryFee: { $sum: '$deliveryFee' },
        totalWalletUsed: { $sum: '$walletUsed' },
        totalCashDue: { $sum: '$cashDue' },
        count: { $sum: 1 }
      }
    }
  ]);

  const result = orders[0] || {
    totalCompanyShare: 0,
    totalPlatformShare: 0,
    totalDeliveryFee: 0,
    totalWalletUsed: 0,
    totalCashDue: 0,
    count: 0
  };

  // For drivers: delivery fees + tips
  // For vendors: their share from companyShare/platformShare
  // For total: company share + platform share + delivery fees
  let totalAmount = 0;
  let description = '';

  if (entity_type === 'driver') {
    totalAmount = result.totalDeliveryFee;
    description = `Driver delivery fees for ${result.count} orders`;
  } else if (entity_type === 'vendor') {
    totalAmount = result.totalCompanyShare + result.totalPlatformShare;
    description = `Vendor shares for ${result.count} orders`;
  } else {
    totalAmount = result.totalCompanyShare + result.totalPlatformShare + result.totalDeliveryFee;
    description = `Total order amounts for ${result.count} orders`;
  }

  return {
    description,
    amount: totalAmount,
    details: [result]
  };
}

/**
 * Calculate wallet movements during the period (available balance changes)
 */
async function calculateWalletMovements(
  period_start: Date,
  period_end: Date,
  entity_type?: 'driver' | 'vendor'
): Promise<ReconciliationSection> {
  let accountTypes: string[] = [];
  let accountTypeFilter: any = {};

  if (entity_type === 'driver') {
    accountTypes = ['driver_wallet'];
    accountTypeFilter = { owner_type: 'driver' };
  } else if (entity_type === 'vendor') {
    accountTypes = ['vendor_wallet'];
    accountTypeFilter = { owner_type: 'vendor' };
  } else {
    accountTypes = ['driver_wallet', 'vendor_wallet'];
    accountTypeFilter = {
      owner_type: { $in: ['driver', 'vendor'] }
    };
  }

  // Get wallet accounts
  const walletAccounts = await WalletAccount.find(accountTypeFilter);

  if (walletAccounts.length === 0) {
    return {
      description: 'No wallet accounts found',
      amount: 0,
      details: []
    };
  }

  // Calculate available balance movements during the period
  const movements = await LedgerSplit.aggregate([
    {
      $match: {
        balance_state: 'available',
        account_type: { $in: accountTypes },
        createdAt: {
          $gte: period_start,
          $lt: period_end
        }
      }
    },
    {
      $group: {
        _id: '$account_type',
        totalCredit: {
          $sum: { $cond: { if: { $eq: ['$side', 'credit'] }, then: '$amount', else: 0 } }
        },
        totalDebit: {
          $sum: { $cond: { if: { $eq: ['$side', 'debit'] }, then: '$amount', else: 0 } }
        },
        count: { $sum: 1 }
      }
    }
  ]);

  const totalMovements = movements.reduce((sum, movement) => {
    return sum + movement.totalCredit - movement.totalDebit;
  }, 0);

  return {
    description: `Wallet movements for ${movements.length} accounts`,
    amount: totalMovements,
    details: movements
  };
}

/**
 * Calculate settlements total (net amounts paid during period)
 */
async function calculateSettlementsTotal(
  period_start: Date,
  period_end: Date,
  entity_type?: 'driver' | 'vendor'
): Promise<ReconciliationSection> {
  let matchConditions: any = {
    status: 'paid',
    paid_at: {
      $gte: period_start,
      $lt: period_end
    }
  };

  if (entity_type) {
    matchConditions.type = entity_type;
  }

  const settlements = await Settlement.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$type',
        totalNetAmount: { $sum: '$net_amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const totalSettlements = settlements.reduce((sum, settlement) => {
    return sum + settlement.totalNetAmount;
  }, 0);

  const typeDescription = entity_type || 'drivers and vendors';

  return {
    description: `Settlements paid to ${typeDescription} (${settlements.length} settlements)`,
    amount: totalSettlements,
    details: settlements
  };
}

/**
 * Validate that ledger entries are balanced for a given period
 */
export async function validateLedgerBalance(
  period_start: Date,
  period_end: Date
): Promise<{
  date: Date;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  entry_count: number;
  unbalanced_entries: any[];
}> {
  const ledgerEntries = await LedgerEntry.find({
    createdAt: {
      $gte: period_start,
      $lt: period_end
    }
  });

  let totalDebit = 0;
  let totalCredit = 0;
  const unbalancedEntries: any[] = [];

  for (const entry of ledgerEntries) {
    totalDebit += entry.total_debit;
    totalCredit += entry.total_credit;

    if (!entry.is_balanced || entry.total_debit !== entry.total_credit) {
      unbalancedEntries.push({
        id: entry._id,
        event_type: entry.event_type,
        event_ref: entry.event_ref,
        total_debit: entry.total_debit,
        total_credit: entry.total_credit,
        is_balanced: entry.is_balanced
      });
    }
  }

  return {
    date: period_start,
    total_debit: totalDebit,
    total_credit: totalCredit,
    is_balanced: totalDebit === totalCredit,
    entry_count: ledgerEntries.length,
    unbalanced_entries: unbalancedEntries
  };
}

/**
 * Generate daily balance validation report
 */
export async function generateDailyBalanceReport(date: Date): Promise<{
  date: Date;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  entry_count: number;
  unbalanced_entries: any[];
}> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await validateLedgerBalance(startOfDay, endOfDay);
}
