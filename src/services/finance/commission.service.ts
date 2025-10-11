import { CommissionRule, ICommissionRule, LedgerEntry, LedgerSplit } from '../../models/finance';

export interface CommissionCalculationResult {
  rule_id: string;
  applicable_to: 'driver' | 'vendor';
  basis: 'percentage' | 'flat';
  value: number;
  calculated_amount: number;
  order_amount: number;
  min?: number;
  max?: number;
}

export interface CommissionApplication {
  order_id: string;
  entity_type: 'driver' | 'vendor';
  entity_id: string;
  order_amount: number;
  commission_amount: number;
  rule_applied: CommissionCalculationResult;
}

/**
 * Create a new commission rule
 */
export async function createCommissionRule(data: {
  applicable_to: 'driver' | 'vendor';
  basis: 'percentage' | 'flat';
  value: number;
  min?: number;
  max?: number;
  effective_from: Date;
  effective_to?: Date;
  priority?: number;
  created_by: string;
}): Promise<ICommissionRule> {
  const priority = data.priority || await getNextPriority(data.applicable_to);

  const rule = new CommissionRule({
    ...data,
    priority,
    is_active: true
  });

  await rule.save();
  return rule;
}

/**
 * Calculate commission for an order
 */
export async function calculateCommission(
  orderAmount: number,
  entityType: 'driver' | 'vendor',
  entityId: string,
  orderDate: Date = new Date()
): Promise<CommissionCalculationResult> {
  // Find applicable rules for this entity type and date
  const applicableRules = await CommissionRule.find({
    applicable_to: entityType,
    is_active: true,
    effective_from: { $lte: orderDate },
    $or: [
      { effective_to: { $exists: false } },
      { effective_to: { $gte: orderDate } }
    ]
  }).sort({ priority: -1 }); // Higher priority first

  if (applicableRules.length === 0) {
    throw new Error(`No commission rules found for ${entityType}`);
  }

  // Use the highest priority rule
  const rule = applicableRules[0];
  let calculatedAmount = 0;

  if (rule.basis === 'percentage') {
    calculatedAmount = (orderAmount * rule.value) / 100;
  } else {
    calculatedAmount = rule.value;
  }

  // Apply min/max constraints
  if (rule.min && calculatedAmount < rule.min) {
    calculatedAmount = rule.min;
  }
  if (rule.max && calculatedAmount > rule.max) {
    calculatedAmount = rule.max;
  }

  return {
    rule_id: rule._id.toString(),
    applicable_to: rule.applicable_to,
    basis: rule.basis,
    value: rule.value,
    calculated_amount: calculatedAmount,
    order_amount: orderAmount,
    min: rule.min,
    max: rule.max
  };
}

/**
 * Apply commission to an order (create ledger entries)
 */
export async function applyCommissionToOrder(
  orderId: string,
  orderAmount: number,
  driverId: string,
  vendorId: string,
  entityType: 'driver' | 'vendor',
  entityId: string
): Promise<CommissionApplication> {
  const commissionResult = await calculateCommission(orderAmount, entityType, entityId);

  // Create ledger entry for commission
  const ledgerEntry = new LedgerEntry({
    event_type: 'order_commission',
    event_ref: orderId,
    description: `Commission for order ${orderId} (${entityType})`,
    total_debit: commissionResult.calculated_amount,
    total_credit: commissionResult.calculated_amount,
    is_balanced: true
  });

  await ledgerEntry.save();

  // Create ledger splits for commission
  const debitSplit = new LedgerSplit({
    entry_id: ledgerEntry._id,
    account_type: `${entityType}_wallet`,
    side: 'debit',
    amount: commissionResult.calculated_amount,
    currency: 'SAR',
    balance_state: 'pending'
  });

  const creditSplit = new LedgerSplit({
    entry_id: ledgerEntry._id,
    account_type: 'company_revenue',
    side: 'credit',
    amount: commissionResult.calculated_amount,
    currency: 'SAR',
    balance_state: 'available'
  });

  await debitSplit.save();
  await creditSplit.save();

  return {
    order_id: orderId,
    entity_type: entityType,
    entity_id: entityId,
    order_amount: orderAmount,
    commission_amount: commissionResult.calculated_amount,
    rule_applied: commissionResult
  };
}

/**
 * Get commission report for a period
 */
export async function getCommissionReport(
  period_start: Date,
  period_end: Date,
  entity_type?: 'driver' | 'vendor'
): Promise<{
  period_start: Date;
  period_end: Date;
  total_commission: number;
  order_count: number;
  average_commission_rate: number;
  rules_applied: any[];
}> {
  let matchConditions: any = {
    event_type: 'order_commission',
    createdAt: {
      $gte: period_start,
      $lt: period_end
    }
  };

  if (entity_type) {
    // This would need to be enhanced based on how we track entity type in ledger entries
    // For now, we'll aggregate all commissions
  }

  const commissionEntries = await LedgerEntry.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: '$total_credit' },
        orderCount: { $sum: 1 }
      }
    }
  ]);

  const result = commissionEntries[0] || { totalCommission: 0, orderCount: 0 };

  // Get rules applied during the period
  const rulesApplied = await CommissionRule.aggregate([
    {
      $match: {
        is_active: true,
        effective_from: { $lte: period_end },
        $or: [
          { effective_to: { $exists: false } },
          { effective_to: { $gte: period_start } }
        ]
      }
    },
    {
      $project: {
        applicable_to: 1,
        basis: 1,
        value: 1,
        min: 1,
        max: 1,
        priority: 1,
        usage_count: { $ifNull: ['$usage_count', 0] }
      }
    },
    { $sort: { priority: -1 } }
  ]);

  const averageCommissionRate = result.orderCount > 0
    ? (result.totalCommission / result.orderCount) * 100
    : 0;

  return {
    period_start,
    period_end,
    total_commission: result.totalCommission,
    order_count: result.orderCount,
    average_commission_rate: averageCommissionRate,
    rules_applied: rulesApplied
  };
}

/**
 * Get next priority number for a commission rule
 */
async function getNextPriority(applicable_to: 'driver' | 'vendor'): Promise<number> {
  const lastRule = await CommissionRule.findOne(
    { applicable_to },
    { priority: 1 },
    { sort: { priority: -1 } }
  );

  return lastRule ? lastRule.priority + 1 : 1;
}

/**
 * Update commission rule usage count (for tracking which rules are used)
 */
export async function updateRuleUsage(ruleId: string): Promise<void> {
  await CommissionRule.findByIdAndUpdate(ruleId, {
    $inc: { usage_count: 1 }
  });
}
