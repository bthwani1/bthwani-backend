import { LedgerEntry, LedgerSplit, WalletAccount, Settlement, PayoutBatch } from '../../models/finance';

// Metrics interface
export interface FinanceMetrics {
  ledger_unbalanced_count: number;
  unsettled_available_sum: number;
  payout_failed_count: number;
  total_settlements_pending: number;
  total_payouts_processing: number;
  wallet_accounts_with_negative_balance: number;
  last_updated: Date;
}

// Alert interface
export interface FinanceAlert {
  id: string;
  type: 'unbalanced_ledger' | 'unsettled_funds' | 'failed_payouts' | 'negative_balance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  threshold?: number;
  current_value?: number;
  created_at: Date;
  resolved_at?: Date;
  resolved_by?: string;
}

/**
 * Collect finance metrics
 */
export async function collectFinanceMetrics(): Promise<FinanceMetrics> {
  const now = new Date();

  // 1. Count unbalanced ledger entries
  const unbalancedLedgers = await LedgerEntry.countDocuments({
    is_balanced: false
  });

  // 2. Sum of unsettled available balance (older than N days)
  const unsettledThreshold = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days
  const unsettledAggregation = await LedgerSplit.aggregate([
    {
      $match: {
        balance_state: 'available',
        createdAt: { $lt: unsettledThreshold }
      }
    },
    {
      $group: {
        _id: null,
        total_amount: { $sum: '$amount' }
      }
    }
  ]);

  const unsettledAvailableSum = unsettledAggregation[0]?.total_amount || 0;

  // 3. Count failed payouts
  const failedPayouts = await PayoutBatch.countDocuments({
    status: { $in: ['processing'] },
    createdAt: { $lt: new Date(now.getTime() - (2 * 60 * 60 * 1000)) } // Older than 2 hours
  });

  // 4. Count pending settlements
  const pendingSettlements = await Settlement.countDocuments({
    status: { $in: ['draft', 'ready'] }
  });

  // 5. Count processing payouts
  const processingPayouts = await PayoutBatch.countDocuments({
    status: 'processing'
  });

  // 6. Count wallet accounts with negative balance
  const negativeBalanceAccounts = await WalletAccount.aggregate([
    {
      $lookup: {
        from: 'ledgersplits',
        localField: '_id',
        foreignField: 'account_id',
        as: 'splits'
      }
    },
    {
      $addFields: {
        total_balance: {
          $sum: {
            $map: {
              input: '$splits',
              as: 'split',
              in: {
                $cond: {
                  if: { $eq: ['$$split.side', 'credit'] },
                  then: '$$split.amount',
                  else: { $multiply: ['$$split.amount', -1] }
                }
              }
            }
          }
        }
      }
    },
    {
      $match: {
        total_balance: { $lt: 0 }
      }
    },
    {
      $count: 'negative_accounts'
    }
  ]);

  const negativeBalanceCount = negativeBalanceAccounts[0]?.negative_accounts || 0;

  return {
    ledger_unbalanced_count: unbalancedLedgers,
    unsettled_available_sum: unsettledAvailableSum,
    payout_failed_count: failedPayouts,
    total_settlements_pending: pendingSettlements,
    total_payouts_processing: processingPayouts,
    wallet_accounts_with_negative_balance: negativeBalanceCount,
    last_updated: now
  };
}

/**
 * Generate finance alerts based on metrics
 */
export async function generateFinanceAlerts(): Promise<FinanceAlert[]> {
  const metrics = await collectFinanceMetrics();
  const alerts: FinanceAlert[] = [];

  // 1. Unbalanced ledger alert
  if (metrics.ledger_unbalanced_count > 0) {
    alerts.push({
      id: `unbalanced-ledger-${Date.now()}`,
      type: 'unbalanced_ledger',
      severity: 'critical',
      title: 'قيود محاسبية غير متوازنة',
      description: `يوجد ${metrics.ledger_unbalanced_count} قيد محاسبي غير متوازن`,
      current_value: metrics.ledger_unbalanced_count,
      created_at: new Date()
    });
  }

  // 2. Unsettled funds alert
  if (metrics.unsettled_available_sum > 1000) { // Threshold: 1000 SAR
    alerts.push({
      id: `unsettled-funds-${Date.now()}`,
      type: 'unsettled_funds',
      severity: 'high',
      title: 'أرصدة متاحة غير مسواة لفترة طويلة',
      description: `يوجد ${metrics.unsettled_available_sum} ريال سعودي متاح غير مسوى لأكثر من 7 أيام`,
      threshold: 1000,
      current_value: metrics.unsettled_available_sum,
      created_at: new Date()
    });
  }

  // 3. Failed payouts alert
  if (metrics.payout_failed_count > 0) {
    alerts.push({
      id: `failed-payouts-${Date.now()}`,
      type: 'failed_payouts',
      severity: 'medium',
      title: 'دفعات فاشلة في المعالجة',
      description: `${metrics.payout_failed_count} دفعة فاشلة في المعالجة لأكثر من ساعتين`,
      current_value: metrics.payout_failed_count,
      created_at: new Date()
    });
  }

  // 4. Negative balance alert
  if (metrics.wallet_accounts_with_negative_balance > 0) {
    alerts.push({
      id: `negative-balance-${Date.now()}`,
      type: 'negative_balance',
      severity: 'high',
      title: 'حسابات محفظة برصيد سالب',
      description: `${metrics.wallet_accounts_with_negative_balance} حساب محفظة برصيد سالب`,
      current_value: metrics.wallet_accounts_with_negative_balance,
      created_at: new Date()
    });
  }

  return alerts;
}

/**
 * Audit log for finance operations
 */
export async function createFinanceAuditLog(
  action: string,
  entity_type: string,
  entity_id: string,
  user_id: string,
  old_values?: any,
  new_values?: any,
  metadata?: any
) {
  // This would typically write to an audit log table/collection
  console.log('Finance Audit Log:', {
    timestamp: new Date(),
    action,
    entity_type,
    entity_id,
    user_id,
    old_values,
    new_values,
    metadata
  });

  // In production, you would save this to a dedicated audit log collection
  // For now, we'll just log it
}

/**
 * Scheduled task to check for alerts (should be run daily)
 */
export async function runDailyFinanceChecks() {
  try {
    const alerts = await generateFinanceAlerts();

    if (alerts.length > 0) {
      console.warn('Finance Alerts Generated:', alerts.length);

      // In production, you would:
      // 1. Send notifications to finance team
      // 2. Create tickets in monitoring system
      // 3. Send emails/Slack messages

      for (const alert of alerts) {
        console.warn(`ALERT [${alert.severity.toUpperCase()}]: ${alert.title} - ${alert.description}`);
      }
    }

    // Log successful check
    console.log(`Daily finance check completed at ${new Date().toISOString()}`);

  } catch (error) {
    console.error('Error running daily finance checks:', error);
  }
}

/**
 * Health check for finance system
 */
export async function getFinanceHealthStatus() {
  try {
    const metrics = await collectFinanceMetrics();

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      metrics,
      issues: []
    };

    // Check for critical issues
    if (metrics.ledger_unbalanced_count > 0) {
      health.status = 'critical';
      health.issues.push({
        type: 'unbalanced_ledger',
        message: `${metrics.ledger_unbalanced_count} unbalanced ledger entries found`
      });
    }

    if (metrics.wallet_accounts_with_negative_balance > 0) {
      health.status = health.status === 'critical' ? 'critical' : 'warning';
      health.issues.push({
        type: 'negative_balance',
        message: `${metrics.wallet_accounts_with_negative_balance} accounts with negative balance`
      });
    }

    if (metrics.payout_failed_count > 0) {
      health.status = health.status === 'critical' ? 'critical' : 'warning';
      health.issues.push({
        type: 'failed_payouts',
        message: `${metrics.payout_failed_count} failed payout batches`
      });
    }

    return health;

  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date(),
      error: error.message,
      metrics: null,
      issues: []
    };
  }
}
