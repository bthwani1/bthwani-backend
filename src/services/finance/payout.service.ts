import mongoose from 'mongoose';
import {
  PayoutBatch,
  PayoutItem,
  WalletAccount,
  LedgerEntry,
  LedgerSplit,
  WalletStatementLine,
  IPayoutBatch,
  IPayoutItem
} from '../../models/finance';
import Driver from '../../models/Driver_app/driver';

export interface PayoutGenerationParams {
  period_start: Date;
  period_end: Date;
  created_by: string;
  min_amount?: number; // minimum amount to include in payout
}

export interface PayoutGenerationResult {
  batch: IPayoutBatch;
  items_count: number;
  total_amount: number;
  drivers_included: number;
}

/**
 * Generate payout batch for drivers with available balance
 */
export async function generatePayoutBatch(params: PayoutGenerationParams): Promise<PayoutGenerationResult> {
  const { period_start, period_end, created_by, min_amount = 0 } = params;

  // Generate batch ID
  const batchId = await generatePayoutBatchId();

  // Find all driver wallet accounts with available balance > min_amount
  const driverAccounts = await WalletAccount.aggregate([
    {
      $match: {
        owner_type: 'driver',
        status: 'active'
      }
    },
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
        available_balance: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$splits',
                  as: 'split',
                  cond: { $eq: ['$$split.balance_state', 'available'] }
                }
              },
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
        available_balance: { $gt: min_amount }
      }
    }
  ]);

  if (driverAccounts.length === 0) {
    throw new Error('No drivers found with sufficient available balance for payout');
  }

  let totalAmount = 0;
  let totalCount = 0;
  const payoutItems: IPayoutItem[] = [];

  // Create payout items for each driver
  for (const account of driverAccounts) {
    const availableBalance = account.available_balance;

    // Get driver details for beneficiary info
    const driver = await Driver.findById(account.owner_id);
    if (!driver) continue;

    // For now, use phone as beneficiary (in production, this would be IBAN or other banking info)
    const beneficiary = driver.phone;

    const payoutItem = new PayoutItem({
      batch_id: batchId,
      account_id: account._id,
      beneficiary,
      amount: availableBalance,
      fees: 0, // PSP fees would be calculated here
      net_amount: availableBalance,
      status: 'pending'
    });

    payoutItems.push(payoutItem);
    totalAmount += availableBalance;
    totalCount++;
  }

  // Create the payout batch
  const batch = new PayoutBatch({
    id: batchId,
    period_start,
    period_end,
    status: 'draft',
    currency: 'SAR',
    total_count: totalCount,
    total_amount: totalAmount,
    created_by
  });

  await batch.save();

  // Save all payout items
  for (const item of payoutItems) {
    item.batch_id = batch._id as mongoose.Types.ObjectId;
    await item.save();
  }

  return {
    batch,
    items_count: totalCount,
    total_amount: totalAmount,
    drivers_included: driverAccounts.length
  };
}

/**
 * Process payout batch (mark as paid and create ledger entries)
 */
export async function processPayoutBatch(batchId: string, processedBy: string): Promise<IPayoutBatch> {
  const batch = await PayoutBatch.findOne({ id: batchId });

  if (!batch) {
    throw new Error('Payout batch not found');
  }

  if (batch.status !== 'draft') {
    throw new Error('Only draft payout batches can be processed');
  }

  // Get all payout items for this batch
  const payoutItems = await PayoutItem.find({ batch_id: batch._id, status: 'pending' });

  if (payoutItems.length === 0) {
    throw new Error('No pending payout items found in this batch');
  }

  // Update batch status to processing
  batch.status = 'processing';
  await batch.save();

  let processedCount = 0;
  let failedCount = 0;

  // Process each payout item
  for (const item of payoutItems) {
    try {
      // Create ledger entry for this payout
      const ledgerEntry = await createPayoutLedgerEntry(item, batch);

      // Update item status
      item.status = 'processed';
      item.ledger_entry_id = ledgerEntry._id as mongoose.Types.ObjectId;
      item.export_ref = `PO-${item._id}`;

      await item.save();
      processedCount++;

      // Create wallet statement line
      await createWalletStatementLine(item, ledgerEntry._id as mongoose.Types.ObjectId);

    } catch (error: any) {
      console.error(`Failed to process payout item ${item._id}:`, error);
      item.status = 'failed';
      item.error_message = error.message;
      await item.save();
      failedCount++;
    }
  }

  // Update batch status
  if (failedCount === 0) {
    batch.status = 'paid';
    batch.processed_by = new mongoose.Types.ObjectId(processedBy);
    batch.processed_at = new Date();
  } else if (processedCount > 0) {
    batch.status = 'paid'; // Partially paid
    batch.notes = `${processedCount} processed, ${failedCount} failed`;
    batch.processed_by = new mongoose.Types.ObjectId(processedBy);
    batch.processed_at = new Date();
  }

  await batch.save();

  if (failedCount > 0) {
    console.warn(`Payout batch ${batchId} completed with ${failedCount} failures`);
  }

  return batch;
}

/**
 * Create ledger entry for a payout item
 */
async function createPayoutLedgerEntry(item: IPayoutItem, batch: IPayoutBatch): Promise<any> {
  const ledgerEntry = new LedgerEntry({
    event_type: 'driver_payout',
    event_ref: item._id.toString(),
    description: `Driver payout - Batch ${batch.id}`,
    total_debit: item.net_amount,
    total_credit: item.net_amount,
    is_balanced: true
  });

  await ledgerEntry.save();

  // Create ledger splits
  const debitSplit = new LedgerSplit({
    entry_id: ledgerEntry._id,
    account_id: item.account_id,
    account_type: 'driver_wallet',
    side: 'debit',
    amount: item.net_amount,
    currency: batch.currency,
    balance_state: 'available'
  });

  const creditSplit = new LedgerSplit({
    entry_id: ledgerEntry._id,
    account_type: 'bank_payout',
    side: 'credit',
    amount: item.net_amount,
    currency: batch.currency,
    balance_state: 'available'
  });

  await debitSplit.save();
  await creditSplit.save();

  return ledgerEntry;
}

/**
 * Create wallet statement line for a payout
 */
async function createWalletStatementLine(item: IPayoutItem, ledgerEntryId: mongoose.Types.ObjectId): Promise<void> {
  const account = await WalletAccount.findById(item.account_id);
  if (!account) return;

  // Get the debit split for this ledger entry
  const debitSplit = await LedgerSplit.findOne({
    entry_id: ledgerEntryId,
    account_id: item.account_id,
    side: 'debit'
  });

  if (!debitSplit) return;

  // Get current balance for running total
  const currentBalance = await getCurrentWalletBalance(account._id as mongoose.Types.ObjectId);

  const statementLine = new WalletStatementLine({
    account_id: account._id as mongoose.Types.ObjectId,
    date: new Date(),
    entry_id: ledgerEntryId,
    split_id: debitSplit._id as mongoose.Types.ObjectId,
    memo: `Driver payout - ${item.beneficiary}`,
    ref_type: 'payout',
    ref_id: item._id.toString(),
    side: 'debit',
    amount: item.net_amount,
    balance_state: 'available',
    running_balance: currentBalance - item.net_amount
  });

  await statementLine.save();
}

/**
 * Get current wallet balance for an account
 */
async function getCurrentWalletBalance(accountId: mongoose.Types.ObjectId): Promise<number> {
  const balanceAggregation = await LedgerSplit.aggregate([
    {
      $match: {
        account_id: accountId,
        $or: [
          { balance_state: 'pending' },
          { balance_state: 'available' }
        ]
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: {
              if: { $eq: ['$side', 'credit'] },
              then: '$amount',
              else: { $multiply: ['$amount', -1] }
            }
          }
        }
      }
    }
  ]);

  return balanceAggregation[0]?.total || 0;
}

/**
 * Generate a unique payout batch ID in format PB-YYYYMM-####
 */
async function generatePayoutBatchId(): Promise<string> {
  const now = new Date();
  const yearMonth = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0');

  // Find the last payout batch ID for this month
  const lastBatch = await PayoutBatch.findOne(
    { id: new RegExp(`^PB-${yearMonth}-\\d{4}$`) },
    { id: 1 },
    { sort: { id: -1 } }
  );

  let sequence = 1;
  if (lastBatch) {
    const lastSequence = parseInt(lastBatch.id.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `PB-${yearMonth}-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Export payout batch to CSV for bank/PSP
 */
export async function exportPayoutBatchToCSV(batchId: string): Promise<string> {
  const batch = await PayoutBatch.findOne({ id: batchId });
  if (!batch) {
    throw new Error('Payout batch not found');
  }

  const items = await PayoutItem.find({ batch_id: batch._id })
    .populate('account_id', 'owner_type owner_id')
    .sort({ createdAt: 1 });

  // CSV headers
  const headers = [
    'batch_id',
    'item_id',
    'driver_id',
    'beneficiary',
    'amount',
    'currency',
    'memo',
    'export_ref'
  ];

  const csvRows = [
    headers.join(','),
    ...items.map(item => [
      batch.id,
      item._id,
      (item.account_id as any).owner_id,
      `"${item.beneficiary}"`,
      item.amount,
      batch.currency,
      `"Driver payout"`,
      item.export_ref || ''
    ].join(','))
  ];

  return csvRows.join('\n');
}

/**
 * Get payout batches with filtering
 */
export async function getPayoutBatches(params?: {
  page?: number;
  perPage?: number;
  status?: string;
  date_from?: Date;
  date_to?: Date;
}) {
  const { page = 1, perPage = 20, status, date_from, date_to } = params || {};

  const query: any = {};
  if (status) query.status = status;
  if (date_from || date_to) {
    query.createdAt = {};
    if (date_from) query.createdAt.$gte = date_from;
    if (date_to) query.createdAt.$lte = date_to;
  }

  const total = await PayoutBatch.countDocuments(query);
  const batches = await PayoutBatch.find(query)
    .populate('created_by', 'fullName email')
    .populate('processed_by', 'fullName email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);

  return {
    batches,
    pagination: {
      page,
      limit: perPage,
      total,
      pages: Math.ceil(total / perPage)
    }
  };
}

/**
 * Get payout batch details with items
 */
export async function getPayoutBatchDetails(batchId: string) {
  const batch = await PayoutBatch.findOne({ id: batchId })
    .populate('created_by', 'fullName email')
    .populate('processed_by', 'fullName email');

  if (!batch) {
    throw new Error('Payout batch not found');
  }

  const items = await PayoutItem.find({ batch_id: batch._id })
    .populate('account_id', 'owner_type owner_id')
    .sort({ createdAt: 1 });

  return {
    batch,
    items
  };
}
