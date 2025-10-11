import { Request, Response } from 'express';
import {
  generatePayoutBatch,
  processPayoutBatch,
  exportPayoutBatchToCSV,
  getPayoutBatches,
  getPayoutBatchDetails
} from '../../services/finance/payout.service';
import { PayoutBatch, PayoutItem, WalletStatementLine } from '../../models/finance';

/**
 * Generate new payout batch for drivers
 * POST /finance/payouts/generate
 */
export const generatePayoutBatchController = async (req: Request, res: Response) => {
  try {
    const { period_start, period_end, min_amount } = req.body;
    const created_by = (req.user as any)?.id;

    if (!period_start || !period_end) {
       res.status(400).json({
        message: 'Missing required fields: period_start, period_end'
      });
      return;
    }

    const result = await generatePayoutBatch({
      period_start: new Date(period_start),
      period_end: new Date(period_end),
      created_by,
      min_amount: min_amount || 0
    });

    res.status(201).json({
      message: 'Payout batch generated successfully',
      batch: {
        id: result.batch.id,
        period_start: result.batch.period_start,
        period_end: result.batch.period_end,
        status: result.batch.status,
        total_count: result.batch.total_count,
        total_amount: result.batch.total_amount
      },
      items_count: result.items_count,
      total_amount: result.total_amount,
      drivers_included: result.drivers_included
    });
  } catch (error: any) {
    console.error('Error generating payout batch:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate payout batch'
    });
  }
};

/**
 * Get all payout batches with filtering and pagination
 * GET /finance/payouts
 */
export const getPayoutBatchesController = async (req: Request, res: Response) => {
  try {
    const { page, perPage, status, date_from, date_to } = req.query as any;

    const result = await getPayoutBatches({
      page: parseInt(page) || 1,
      perPage: parseInt(perPage) || 20,
      status,
      date_from: date_from ? new Date(date_from) : undefined,
      date_to: date_to ? new Date(date_to) : undefined
    });

    res.json({
      batches: result.batches,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error fetching payout batches:', error);
    res.status(500).json({ message: 'Failed to fetch payout batches' });
  }
};

/**
 * Get payout batch details with items
 * GET /finance/payouts/:id
 */
export const getPayoutBatchDetailsController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await getPayoutBatchDetails(id);

    res.json({
      batch: result.batch,
      items: result.items
    });
  } catch (error: any) {
    console.error('Error fetching payout batch details:', error);
    res.status(404).json({ message: error.message || 'Payout batch not found' });
  }
};

/**
 * Process payout batch (mark as paid)
 * PATCH /finance/payouts/:id/process
 */
export const processPayoutBatchController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const processed_by = (req.user as any)?.id;

    const batch = await processPayoutBatch(id, processed_by);

    res.json({
      message: 'Payout batch processed successfully',
      batch
    });
  } catch (error: any) {
    console.error('Error processing payout batch:', error);
    res.status(400).json({ message: error.message || 'Failed to process payout batch' });
  }
};

/**
 * Export payout batch to CSV
 * GET /finance/payouts/:id/export.csv
 */
export const exportPayoutBatchToCSVController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const csvContent = await exportPayoutBatchToCSV(id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payout-batch-${id}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    console.error('Error exporting payout batch to CSV:', error);
    res.status(404).json({ message: error.message || 'Payout batch not found' });
  }
};

/**
 * Get wallet statement for an account
 * GET /finance/payouts/wallet-statement/:accountId
 */
export const getWalletStatementController = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { date_from, date_to, balance_state } = req.query as any;

    const query: any = { account_id: accountId };

    if (date_from || date_to) {
      query.date = {};
      if (date_from) query.date.$gte = new Date(date_from);
      if (date_to) query.date.$lte = new Date(date_to);
    }

    if (balance_state) {
      query.balance_state = balance_state;
    }

    const statementLines = await WalletStatementLine.find(query)
      .populate('entry_id')
      .sort({ date: -1 })
      .limit(1000); // Limit for performance

    res.json({
      account_id: accountId,
      statement_lines: statementLines,
      count: statementLines.length
    });
  } catch (error: any) {
    console.error('Error fetching wallet statement:', error);
    res.status(500).json({ message: 'Failed to fetch wallet statement' });
  }
};

/**
 * Export wallet statement to CSV
 * GET /finance/payouts/wallet-statement/:accountId/export.csv
 */
export const exportWalletStatementToCSVController = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { date_from, date_to, balance_state } = req.query as any;

    const query: any = { account_id: accountId };

    if (date_from || date_to) {
      query.date = {};
      if (date_from) query.date.$gte = new Date(date_from);
      if (date_to) query.date.$lte = new Date(date_to);
    }

    if (balance_state) {
      query.balance_state = balance_state;
    }

    const statementLines = await WalletStatementLine.find(query)
      .sort({ date: 1 }); // Chronological order for CSV

    // CSV headers
    const headers = [
      'date',
      'entry_id',
      'split_id',
      'memo',
      'ref_type',
      'ref_id',
      'side',
      'amount',
      'balance_state',
      'running_balance'
    ];

    const csvRows = [
      headers.join(','),
      ...statementLines.map(line => [
        line.date.toISOString(),
        line.entry_id,
        line.split_id,
        `"${line.memo}"`,
        line.ref_type,
        line.ref_id || '',
        line.side,
        line.amount,
        line.balance_state,
        line.running_balance
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="wallet-statement-${accountId}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    console.error('Error exporting wallet statement to CSV:', error);
    res.status(500).json({ message: 'Failed to export wallet statement to CSV' });
  }
};
