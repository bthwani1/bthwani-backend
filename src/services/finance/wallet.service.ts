import { WalletAccount, IWalletAccount, LedgerEntry, LedgerSplit } from '../../models/finance';
import Driver from '../../models/Driver_app/driver';

export interface WalletBalance {
  account_id: string;
  owner_type: string;
  owner_id: string;
  currency: string;
  pending_amount: number;
  available_amount: number;
  total_amount: number;
}

export interface CreateWalletAccountParams {
  owner_type: 'driver' | 'vendor' | 'company' | 'user';
  owner_id: string;
  currency?: string;
}

/**
 * Create or get existing wallet account for an owner
 */
export async function createWalletAccount(params: CreateWalletAccountParams): Promise<IWalletAccount> {
  const { owner_type, owner_id, currency = 'SAR' } = params;

  // Check if account already exists
  let account = await WalletAccount.findOne({
    owner_type,
    owner_id
  });

  if (!account) {
    account = new WalletAccount({
      owner_type,
      owner_id,
      currency,
      status: 'active'
    });
    await account.save();
  }

  return account;
}

/**
 * Get wallet balance for an account
 */
export async function getWalletBalance(accountId: string): Promise<WalletBalance> {
  const account = await WalletAccount.findById(accountId);
  if (!account) {
    throw new Error('Wallet account not found');
  }

  // Calculate balances from ledger splits
  const balanceAggregation = await LedgerSplit.aggregate([
    {
      $match: {
        account_id: account._id as any,
        $or: [
          { balance_state: 'pending' },
          { balance_state: 'available' }
        ]
      }
    },
    {
      $group: {
        _id: '$balance_state',
        total: { $sum: { $cond: { if: { $eq: ['$side', 'credit'] }, then: '$amount', else: { $multiply: ['$amount', -1] } } } }
      }
    }
  ]);

  const pendingAmount = balanceAggregation.find(b => b._id === 'pending')?.total || 0;
  const availableAmount = balanceAggregation.find(b => b._id === 'available')?.total || 0;

  return {
    account_id: (account._id as any).toString(),
    owner_type: account.owner_type,
    owner_id: (account.owner_id as any).toString(),
    currency: account.currency,
    pending_amount: pendingAmount,
    available_amount: availableAmount,
    total_amount: pendingAmount + availableAmount
  };
}

/**
 * Create ledger entry for order payment (user pays)
 */
export async function createOrderPaymentLedgerEntry(
  orderId: string,
  orderAmount: number,
  driverId: string,
  vendorId: string,
  companyCommission: number
): Promise<any> {
  // Create ledger entry
  const ledgerEntry = new LedgerEntry({
    event_type: 'order_paid',
    event_ref: orderId,
    description: `Payment for order ${orderId}`,
    total_debit: orderAmount,
    total_credit: orderAmount,
    is_balanced: true
  });

  await ledgerEntry.save();

  // Get wallet accounts
  const driverAccount = await WalletAccount.findOne({ owner_type: 'driver', owner_id: driverId });
  const vendorAccount = await WalletAccount.findOne({ owner_type: 'vendor', owner_id: vendorId });

  if (!driverAccount || !vendorAccount) {
    throw new Error('Wallet accounts not found for driver or vendor');
  }

  // Calculate driver share (delivery fee + tips)
  const driver = await Driver.findById(driverId);
  const driverShare = orderAmount - companyCommission; // Simplified - in reality this would be calculated based on pricing rules

  // Create ledger splits
  const splits = [];

  // Debit: PSP Clearing (payment received from user)
  splits.push(new LedgerSplit({
    entry_id: ledgerEntry._id as any,
    account_type: 'psp_clearing',
    side: 'debit',
    amount: orderAmount,
    currency: 'SAR',
    balance_state: 'available'
  }));

  // Credit: Company Revenue (commission)
  splits.push(new LedgerSplit({
    entry_id: ledgerEntry._id as any,
    account_type: 'company_revenue',
    side: 'credit',
    amount: companyCommission,
    currency: 'SAR',
    balance_state: 'available'
  }));

  // Credit: Driver Wallet (pending)
  splits.push(new LedgerSplit({
    entry_id: ledgerEntry._id as any,
    account_id: driverAccount._id as any,
    account_type: 'driver_wallet',
    side: 'credit',
    amount: driverShare,
    currency: 'SAR',
    balance_state: 'pending'
  }));

  // Credit: Vendor Wallet (pending)
  splits.push(new LedgerSplit({
    entry_id: ledgerEntry._id as any,
    account_id: vendorAccount._id as any,
    account_type: 'vendor_wallet',
    side: 'credit',
    amount: orderAmount - driverShare - companyCommission,
    currency: 'SAR',
    balance_state: 'pending'
  }));

  await Promise.all(splits.map(split => split.save()));

  return ledgerEntry;
}

/**
 * Create ledger entry for order delivery (pending to available)
 */
export async function createOrderDeliveryLedgerEntry(orderId: string): Promise<any> {
  // Find the original order payment entry
  const orderPaymentEntry = await LedgerEntry.findOne({
    event_type: 'order_paid',
    event_ref: orderId
  });

  if (!orderPaymentEntry) {
    throw new Error('Order payment entry not found');
  }

  // Get pending splits for this order
  const pendingSplits = await LedgerSplit.find({
    entry_id: orderPaymentEntry._id as any,
    balance_state: 'pending'
  });

  if (pendingSplits.length === 0) {
    throw new Error('No pending splits found for order');
  }

  // Create delivery ledger entry
  const totalPendingAmount = pendingSplits.reduce((sum, split) => sum + split.amount, 0);

  const deliveryEntry = new LedgerEntry({
    event_type: 'order_delivered',
    event_ref: orderId,
    description: `Order delivery confirmation for ${orderId}`,
    total_debit: totalPendingAmount,
    total_credit: totalPendingAmount,
    is_balanced: true
  });

  await deliveryEntry.save();

  // Create transfer splits for each pending split
  for (const pendingSplit of pendingSplits) {
    // Debit from pending
    const debitSplit = new LedgerSplit({
      entry_id: deliveryEntry._id as any,
      account_id: pendingSplit.account_id as any,
      account_type: pendingSplit.account_type,
      side: 'debit',
      amount: pendingSplit.amount,
      currency: pendingSplit.currency,
      balance_state: 'pending'
    });

    // Credit to available
    const creditSplit = new LedgerSplit({
      entry_id: deliveryEntry._id as any,
      account_id: pendingSplit.account_id as any,
      account_type: pendingSplit.account_type,
      side: 'credit',
      amount: pendingSplit.amount,
      currency: pendingSplit.currency,
      balance_state: 'available'
    });

    await debitSplit.save();
    await creditSplit.save();
  }

  return deliveryEntry;
}

/**
 * Get wallet balances for all accounts of a specific type
 */
export async function getWalletBalancesByType(ownerType: 'driver' | 'vendor' | 'company' | 'user'): Promise<WalletBalance[]> {
  const accounts = await WalletAccount.find({ owner_type: ownerType, status: 'active' });

  const balances = await Promise.all(
    accounts.map(account => getWalletBalance((account._id as any).toString()))
  );

  return balances;
}

/**
 * Get total available balance for settlement eligibility
 */
export async function getAvailableBalanceForSettlement(ownerType: 'driver' | 'vendor'): Promise<number> {
  const balances = await getWalletBalancesByType(ownerType);
  return balances.reduce((total, balance) => total + balance.available_amount, 0);
}
