import { Request, Response } from 'express';
import { parseListQuery } from '../../utils/query';
import { generateSettlement, markSettlementAsPaid } from '../../services/finance/settlement.service';
import { Settlement, SettlementLine } from '../../models/finance';

/**
 * Generate new settlement for drivers or vendors
 * POST /finance/settlements/generate
 */
export const generateSettlementController = async (req: Request, res: Response) => {
  try {
    const { type, period_start, period_end } = req.body;
    const created_by = (req.user as any)?.id;

    if (!type || !period_start || !period_end) {
       res.status(400).json({
        message: 'Missing required fields: type, period_start, period_end'
      });
    }

    if (!['driver', 'vendor'].includes(type)) {
       res.status(400).json({
        message: 'Type must be either "driver" or "vendor"'
      });
    }

    const result = await generateSettlement({
      type,
      period_start: new Date(period_start),
      period_end: new Date(period_end),
      created_by
    });

    res.status(201).json({
      message: 'Settlement generated successfully',
      settlement: {
        id: result.settlement.id,
        type: result.settlement.type,
        period_start: result.settlement.period_start,
        period_end: result.settlement.period_end,
        status: result.settlement.status,
        gross_amount: result.settlement.gross_amount,
        fees: result.settlement.fees,
        adjustments: result.settlement.adjustments,
        net_amount: result.settlement.net_amount
      },
      lines_count: result.lines_count,
      total_gross_amount: result.total_gross_amount,
      total_fees: result.total_fees,
      total_adjustments: result.total_adjustments,
      total_net_amount: result.total_net_amount
    });
  } catch (error: any) {
    console.error('Error generating settlement:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate settlement'
    });
  }
};

/**
 * Get all settlements with filtering and pagination
 * GET /finance/settlements
 */
export const getSettlements = async (req: Request, res: Response) => {
  try {
    const { page, perPage, sort, filters } = parseListQuery(req.query);

    const query: any = {};
    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;
    if (filters?.period_start || filters?.period_end) {
      query.period_start = {};
      if (filters.period_start) query.period_start.$gte = new Date(filters.period_start);
      if (filters.period_end) query.period_start.$lte = new Date(filters.period_end);
    }

    const total = await Settlement.countDocuments(query);
    const settlements = await Settlement.find(query)
      .populate('payable_account_id', 'owner_type owner_id')
      .populate('created_by', 'fullName email')
      .populate('paid_by', 'fullName email')
      .sort(sort || { createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    res.json({
      settlements,
      pagination: {
        page,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage)
      },
      meta: {
        page,
        per_page: perPage,
        total,
        returned: settlements.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ message: 'Failed to fetch settlements' });
  }
};

/**
 * Get settlement by ID
 * GET /finance/settlements/:id
 */
export const getSettlementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const settlement = await Settlement.findOne({ id })
      .populate('payable_account_id', 'owner_type owner_id')
      .populate('created_by', 'fullName email')
      .populate('paid_by', 'fullName email');

    if (!settlement) {
       res.status(404).json({ message: 'Settlement not found' });
      return;
    }

    // Get settlement lines
    const settlementLines = await SettlementLine.find({ settlement_id: settlement._id })
      .populate('ledger_entry_id')
      .sort({ createdAt: 1 });

    res.json({
      settlement,
      lines: settlementLines
    });
  } catch (error: any) {
    console.error('Error fetching settlement:', error);
    res.status(500).json({ message: 'Failed to fetch settlement' });
  }
};

/**
 * Mark settlement as paid
 * PATCH /finance/settlements/:id/mark-paid
 */
export const markSettlementAsPaidController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paid_by = (req.user as any)?.id;

    const settlement = await markSettlementAsPaid(id, paid_by);

    res.json({
      message: 'Settlement marked as paid successfully',
      settlement
    });
  } catch (error: any) {
    console.error('Error marking settlement as paid:', error);
      res.status(400).json({ message: error.message || 'Failed to mark settlement as paid' });
  }
};

/**
 * Export settlement to CSV
 * GET /finance/settlements/:id/export.csv
 */
export const exportSettlementToCSV = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const settlement = await Settlement.findOne({ id });
    if (!settlement) {
       res.status(404).json({ message: 'Settlement not found' });
      return;
    }

    // Get settlement lines
    const settlementLines = await SettlementLine.find({ settlement_id: settlement._id })
      .populate('ledger_entry_id')
      .sort({ createdAt: 1 });

    // Generate CSV content
    const csvHeaders = [
      'settlement_id',
      'type',
      'period_start',
      'period_end',
      'currency',
      'line_id',
      'ref_type',
      'ref_id',
      'description',
      'amount',
      'gross_amount',
      'fees',
      'adjustments',
      'net_amount',
      'payable_account_id'
    ];

    const csvRows = [
      csvHeaders.join(','),
      ...settlementLines.map(line => [
        settlement.id,
        settlement.type,
        settlement.period_start.toISOString(),
        settlement.period_end.toISOString(),
        settlement.currency,
        line._id,
        line.ref_type,
        line.ref_id,
        `"${line.description}"`,
        line.amount,
        settlement.gross_amount,
        settlement.fees,
        settlement.adjustments,
        settlement.net_amount,
        settlement.payable_account_id
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="settlement-${settlement.id}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    console.error('Error exporting settlement to CSV:', error);
    res.status(500).json({ message: 'Failed to export settlement to CSV' });
  }
};
