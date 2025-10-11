import mongoose from 'mongoose';
import {
  Settlement,
  SettlementLine,
  WalletAccount,
  LedgerEntry,
  LedgerSplit,
  ISettlement,
  ISettlementLine
} from '../../models/finance';
import { IDeliveryOrder } from '../../models/delivery_marketplace_v1/Order';
import { IDriver } from '../../models/Driver_app/driver';
import DeliveryOrder from '../../models/delivery_marketplace_v1/Order';
import Driver from '../../models/Driver_app/driver';

export interface SettlementGenerationParams {
  type: 'driver' | 'vendor';
  period_start: Date;
  period_end: Date;
  created_by: string;
}

export interface SettlementGenerationResult {
  settlement: ISettlement;
  lines_count: number;
  total_gross_amount: number;
  total_fees: number;
  total_adjustments: number;
  total_net_amount: number;
}

/**
 * Generate settlement for drivers or vendors for a given period
 */
export async function generateSettlement(params: SettlementGenerationParams): Promise<SettlementGenerationResult> {
  const { type, period_start, period_end, created_by } = params;

  // Generate settlement ID
  const settlementId = await generateSettlementId();

  // Find wallet accounts for the given type
  const walletAccounts = await WalletAccount.find({
    owner_type: type,
    status: 'active'
  });

  if (walletAccounts.length === 0) {
    throw new Error(`No active ${type} accounts found`);
  }

  // For each wallet account, find unsettled delivered orders
  let totalGrossAmount = 0;
  let totalFees = 0;
  let totalAdjustments = 0;
  const settlementLines: ISettlementLine[] = [];

  for (const walletAccount of walletAccounts) {
    const ownerId = walletAccount.owner_id;

    // Find unsettled orders for this owner
    let unsettledOrders: IDeliveryOrder[] = [];

    if (type === 'driver') {
      unsettledOrders = await DeliveryOrder.find({
        driver: ownerId,
        status: 'delivered',
        deliveredAt: {
          $gte: period_start,
          $lte: period_end
        },
        // Check if order is not already in a settlement
        $nor: [
          {
            _id: {
              $in: await SettlementLine.distinct('ref_id', {
                ref_type: 'order',
                'settlement_id.settlement_id': { $ne: settlementId }
              })
            }
          }
        ]
      });
    } else if (type === 'vendor') {
      // For vendors, we need to check subOrders
      unsettledOrders = await DeliveryOrder.find({
        'subOrders.store': ownerId,
        status: 'delivered',
        deliveredAt: {
          $gte: period_start,
          $lte: period_end
        },
        // Check if order is not already in a settlement
        $nor: [
          {
            _id: {
              $in: await SettlementLine.distinct('ref_id', {
                ref_type: 'order',
                'settlement_id.settlement_id': { $ne: settlementId }
              })
            }
          }
        ]
      });
    }

    // Create settlement lines for each unsettled order
    for (const order of unsettledOrders) {
      let amount = 0;

      if (type === 'driver') {
        // Driver gets delivery fee + tips
        amount = order.deliveryFee + (order.errand?.tip || 0);
      } else if (type === 'vendor') {
        // Vendor gets their share from items
        const vendorShare = order.companyShare; // This should be calculated based on vendor's cut
        amount = vendorShare;
      }

      if (amount > 0) {
        const settlementLine = new SettlementLine({
          settlement_id: settlementId,
          ref_type: 'order',
          ref_id: order._id.toString(),
          description: `Order #${order._id} - ${order.address.label}`,
          amount: amount
        });

        settlementLines.push(settlementLine);
        totalGrossAmount += amount;
      }
    }
  }

  // Create the settlement record
  const settlement = new Settlement({
    id: settlementId,
    type,
    period_start,
    period_end,
    currency: 'SAR',
    status: 'ready',
    payable_account_id: walletAccounts[0]._id as mongoose.Types.ObjectId, // For now, use the first account - in practice, this should be per-entity
    gross_amount: totalGrossAmount,
    fees: totalFees,
    adjustments: totalAdjustments,
    net_amount: totalGrossAmount - totalFees - totalAdjustments,
    created_by: new mongoose.Types.ObjectId(created_by)
  });

  await settlement.save();

  // Save all settlement lines
  for (const line of settlementLines) {
    line.settlement_id = settlement._id as mongoose.Types.ObjectId;
    await line.save();
  }

  return {
    settlement,
    lines_count: settlementLines.length,
    total_gross_amount: totalGrossAmount,
    total_fees: totalFees,
    total_adjustments: totalAdjustments,
    total_net_amount: settlement.net_amount
  };
}

/**
 * Generate a unique settlement ID in format S-YYYYMM-####
 */
async function generateSettlementId(): Promise<string> {
  const now = new Date();
  const yearMonth = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0');

  // Find the last settlement ID for this month
  const lastSettlement = await Settlement.findOne(
    { id: new RegExp(`^S-${yearMonth}-\\d{4}$`) },
    { id: 1 },
    { sort: { id: -1 } }
  );

  let sequence = 1;
  if (lastSettlement) {
    const lastSequence = parseInt(lastSettlement.id.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `S-${yearMonth}-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Mark settlement as paid
 */
export async function markSettlementAsPaid(settlementId: string, paidBy: string): Promise<ISettlement> {
  const settlement = await Settlement.findOne({ id: settlementId });

  if (!settlement) {
    throw new Error('Settlement not found');
  }

  if (settlement.status !== 'ready') {
    throw new Error('Only ready settlements can be marked as paid');
  }

  settlement.status = 'paid';
  settlement.paid_by = new mongoose.Types.ObjectId(paidBy);
  settlement.paid_at = new Date();

  await settlement.save();

  // Create ledger entry for the settlement payment
  await createSettlementLedgerEntry(settlement);

  return settlement;
}

/**
 * Create ledger entry for settlement payment
 */
async function createSettlementLedgerEntry(settlement: ISettlement): Promise<void> {
  const ledgerEntry = new LedgerEntry({
    event_type: 'settlement_paid',
    event_ref: settlement.id,
    description: `Settlement payment for ${settlement.type} - ${settlement.id}`,
    total_debit: settlement.net_amount,
    total_credit: settlement.net_amount,
    is_balanced: true,
    created_by: settlement.paid_by as mongoose.Types.ObjectId
  });

  await ledgerEntry.save();

  // Create ledger splits
  const debitSplit = new LedgerSplit({
    entry_id: ledgerEntry._id as mongoose.Types.ObjectId,
    account_type: `${settlement.type}_wallet`,
    side: 'debit',
    amount: settlement.net_amount,
    currency: settlement.currency,
    balance_state: 'available'
  });

  const creditSplit = new LedgerSplit({
    entry_id: ledgerEntry._id as mongoose.Types.ObjectId,
    account_type: 'bank',
    side: 'credit',
    amount: settlement.net_amount,
    currency: settlement.currency,
    balance_state: 'available'
  });

  await debitSplit.save();
  await creditSplit.save();
}
