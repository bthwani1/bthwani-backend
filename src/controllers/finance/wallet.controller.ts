import { Request, Response } from 'express';
import {
  createWalletAccount,
  getWalletBalance,
  getWalletBalancesByType,
  getAvailableBalanceForSettlement
} from '../../services/finance/wallet.service';
import { WalletAccount, LedgerEntry, LedgerSplit } from '../../models/finance';

/**
 * Get wallet balance for current user
 * GET /finance/wallet/balance
 */
export const getWalletBalanceController = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
       res.status(401).json({ message: 'Unauthorized' });
       return;
    }

    let account;
    if (user.role === 'driver') {
      account = await WalletAccount.findOne({
        owner_type: 'driver',
        owner_id: user.driverId || user.id
      });
    } else if (user.role === 'vendor') {
      account = await WalletAccount.findOne({
        owner_type: 'vendor',
        owner_id: user.vendorId || user.id
      });
    } else {
       res.status(400).json({ message: 'Wallet not available for this user type' });
       return;
    }

    if (!account) {
       res.status(404).json({ message: 'Wallet account not found' });
       return;
    }

    const balance = await getWalletBalance(account._id.toString());

    res.json({
      account: {
        id: account._id,
        owner_type: account.owner_type,
        owner_id: account.owner_id,
        currency: account.currency,
        status: account.status
      },
      balance
    });
  } catch (error: any) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch wallet balance' });
  }
};

/**
 * Get wallet balances for all accounts of a specific type (admin only)
 * GET /finance/wallet/balances/:type
 */
export const getWalletBalancesByTypeController = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (!['driver', 'vendor', 'company', 'user'].includes(type)) {
       res.status(400).json({ message: 'Invalid owner type' });
       return;
    }

    const balances = await getWalletBalancesByType(type as any);

    res.json({
      owner_type: type,
      balances,
      total_available: balances.reduce((sum, balance) => sum + balance.available_amount, 0)
    });
  } catch (error: any) {
    console.error('Error fetching wallet balances:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch wallet balances' });
  }
};

/**
 * Get available balance for settlement (admin only)
 * GET /finance/wallet/settlement-balance/:type
 */
export const getSettlementBalanceController = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (!['driver', 'vendor'].includes(type)) {
       res.status(400).json({ message: 'Invalid owner type for settlement' });
       return;
    }

    const availableBalance = await getAvailableBalanceForSettlement(type as any);

    res.json({
      owner_type: type,
      available_balance: availableBalance,
      can_settle: availableBalance > 0
    });
  } catch (error: any) {
    console.error('Error fetching settlement balance:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch settlement balance' });
    return;
  }
};

/**
 * Get ledger entries with filtering
 * GET /finance/ledger/entries
 */
export const getLedgerEntries = async (req: Request, res: Response) => {
  try {
    const { page = 1, perPage = 20, sort, filters } = req.query as any;

    const query: any = {};
    if (filters?.event_type) query.event_type = filters.event_type;
    if (filters?.event_ref) query.event_ref = filters.event_ref;
    if (filters?.date_from || filters?.date_to) {
      query.createdAt = {};
      if (filters.date_from) query.createdAt.$gte = new Date(filters.date_from);
      if (filters.date_to) query.createdAt.$lte = new Date(filters.date_to);
    }

    const total = await LedgerEntry.countDocuments(query);
    const entries = await LedgerEntry.find(query)
      .populate('created_by', 'fullName email')
      .sort(sort || { createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    // Get splits for each entry
    const entriesWithSplits = await Promise.all(
      entries.map(async (entry) => {
        const splits = await LedgerSplit.find({ entry_id: entry._id })
          .populate('account_id', 'owner_type owner_id')
          .sort({ side: 1, account_type: 1 });

        return {
          ...entry,
          splits
        };
      })
    );

    res.json({
      entries: entriesWithSplits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(perPage),
        total,
        pages: Math.ceil(total / perPage)
      },
      meta: {
        page: parseInt(page),
        per_page: parseInt(perPage),
        total,
        returned: entriesWithSplits.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching ledger entries:', error);
    res.status(500).json({ message: 'Failed to fetch ledger entries' });
  }
};

/**
 * Get ledger entry by ID with splits
 * GET /finance/ledger/entries/:id
 */
export const getLedgerEntryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const entry = await LedgerEntry.findById(id)
      .populate('created_by', 'fullName email');

    if (!entry) {
       res.status(404).json({ message: 'Ledger entry not found' });
       return;
    }

    const splits = await LedgerSplit.find({ entry_id: entry._id })
      .populate('account_id', 'owner_type owner_id')
      .sort({ side: 1, account_type: 1 });

    res.json({
      entry,
      splits
    });
  } catch (error: any) {
    console.error('Error fetching ledger entry:', error);
    res.status(500).json({ message: 'Failed to fetch ledger entry' });
  }
};
