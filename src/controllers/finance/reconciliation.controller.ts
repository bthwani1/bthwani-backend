import { Request, Response } from 'express';
import {
  generateReconciliationReport,
  validateLedgerBalance,
  generateDailyBalanceReport
} from '../../services/finance/reconciliation.service';

/**
 * Generate reconciliation report for a period
 * GET /finance/reconciliation/report
 */
export const generateReconciliationReportController = async (req: Request, res: Response) => {
  try {
    const { period_start, period_end, entity_type } = req.query;

    if (!period_start || !period_end) {
       res.status(400).json({
        message: 'Missing required parameters: period_start, period_end'
      });
      return;
    }

    const startDate = new Date(period_start as string);
    const endDate = new Date(period_end as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
       res.status(400).json({
        message: 'Invalid date format for period_start or period_end'
      });
      return;
    }

    if (startDate >= endDate) {
       res.status(400).json({
        message: 'period_start must be before period_end'
      });
      return;
    }

    const report = await generateReconciliationReport(
      startDate,
      endDate,
      entity_type as 'driver' | 'vendor' | undefined
    );

    res.json({
      message: 'Reconciliation report generated successfully',
      report
    });
  } catch (error: any) {
    console.error('Error generating reconciliation report:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate reconciliation report'
    });
  }
};

/**
 * Validate ledger balance for a period
 * GET /finance/reconciliation/validate-balance
 */
export const validateLedgerBalanceController = async (req: Request, res: Response) => {
  try {
    const { period_start, period_end } = req.query;

    if (!period_start || !period_end) {
       res.status(400).json({
        message: 'Missing required parameters: period_start, period_end'
      });
      return;
    }

    const startDate = new Date(period_start as string);
    const endDate = new Date(period_end as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
       res.status(400).json({
        message: 'Invalid date format for period_start or period_end'
      });
      return;
    
    }

    if (startDate >= endDate) {
       res.status(400).json({
        message: 'period_start must be before period_end'
      });
      return;
    }

    const validation = await validateLedgerBalance(startDate, endDate);

    res.json({
      message: 'Ledger balance validation completed',
      period_start: startDate,
      period_end: endDate,
      ...validation
    });
  } catch (error: any) {
    console.error('Error validating ledger balance:', error);
    res.status(500).json({
      message: error.message || 'Failed to validate ledger balance'
    });
  }
};

/**
 * Generate daily balance report
 * GET /finance/reconciliation/daily-report/:date
 */
export const generateDailyBalanceReportController = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    const reportDate = new Date(date);

    if (isNaN(reportDate.getTime())) {
       res.status(400).json({
        message: 'Invalid date format'
      });
      return;
    }

    const report = await generateDailyBalanceReport(reportDate);

    res.json({
      message: 'Daily balance report generated successfully',
      ...report
    });
  } catch (error: any) {
    console.error('Error generating daily balance report:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate daily balance report'
    });
  }
};
