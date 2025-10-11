import { Request, Response } from 'express';
import {
  generateDailyReportComparison,
  getDailyOrdersDetails,
  getDailyWalletStatementDetails,
  exportDailyComparisonToCSV,
  generateMonthlyReportComparison
} from '../../services/finance/daily-report.service';

/**
 * Generate daily report comparison between orders and wallet statement
 * GET /finance/reports/daily-comparison/:date
 */
export const generateDailyReportComparisonController = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    const reportDate = new Date(date);

    if (isNaN(reportDate.getTime())) {
       res.status(400).json({
        message: 'Invalid date format'
      });
      return;
    }

    const comparison = await generateDailyReportComparison(reportDate);

    res.json({
      message: 'Daily report comparison generated successfully',
      comparison
    });
  } catch (error: any) {
    console.error('Error generating daily report comparison:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate daily report comparison'
    });
  }
};

/**
 * Get detailed daily orders for a specific date
 * GET /finance/reports/daily-orders/:date
 */
export const getDailyOrdersDetailsController = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    const reportDate = new Date(date);

    if (isNaN(reportDate.getTime())) {
       res.status(400).json({
        message: 'Invalid date format'
      });
    }

    const ordersDetails = await getDailyOrdersDetails(reportDate);

    res.json({
      message: 'Daily orders details retrieved successfully',
      date: reportDate,
      orders: ordersDetails,
      count: ordersDetails.length
    });
  } catch (error: any) {
    console.error('Error fetching daily orders details:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch daily orders details'
    });
  }
};

/**
 * Get detailed wallet statement for a specific date
 * GET /finance/reports/daily-wallet-statement/:date
 */
export const getDailyWalletStatementDetailsController = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { account_id } = req.query;

    const reportDate = new Date(date);

    if (isNaN(reportDate.getTime())) {
        res.status(400).json({
        message: 'Invalid date format'
      });
      return;
    }

    const walletDetails = await getDailyWalletStatementDetails(
      reportDate,
      account_id as string
    );

    res.json({
      message: 'Daily wallet statement details retrieved successfully',
      date: reportDate,
      account_id: account_id || 'all',
      statement_lines: walletDetails,
      count: walletDetails.length
    });
  } catch (error: any) {
    console.error('Error fetching daily wallet statement details:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch daily wallet statement details'
    });
  }
};

/**
 * Export daily comparison to CSV
 * GET /finance/reports/daily-comparison/:date/export.csv
 */
export const exportDailyComparisonToCSVController = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    const reportDate = new Date(date);

    if (isNaN(reportDate.getTime())) {
       res.status(400).json({
        message: 'Invalid date format'
      });
      return;
    }

    const csvContent = await exportDailyComparisonToCSV(reportDate);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="daily-comparison-${date}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    console.error('Error exporting daily comparison to CSV:', error);
    res.status(500).json({
      message: error.message || 'Failed to export daily comparison to CSV'
    });
  }
};

/**
 * Generate monthly report comparison
 * GET /finance/reports/monthly-comparison/:year/:month
 */
export const generateMonthlyReportComparisonController = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.params;

    const reportYear = parseInt(year);
    const reportMonth = parseInt(month);

    if (isNaN(reportYear) || isNaN(reportMonth) || reportMonth < 1 || reportMonth > 12) {
       res.status(400).json({
        message: 'Invalid year or month format'
      });
      return;
    }

    const monthlyReport = await generateMonthlyReportComparison(reportYear, reportMonth);

    res.json({
      message: 'Monthly report comparison generated successfully',
      monthly_report: monthlyReport
    });
  } catch (error: any) {
    console.error('Error generating monthly report comparison:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate monthly report comparison'
    });
  }
};
