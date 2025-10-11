import { Request, Response } from 'express';
import {
  collectFinanceMetrics,
  generateFinanceAlerts,
  runDailyFinanceChecks,
  getFinanceHealthStatus
} from '../../services/finance/monitoring.service';

/**
 * Get finance metrics
 * GET /finance/monitoring/metrics
 */
export const getFinanceMetricsController = async (req: Request, res: Response) => {
  try {
    const metrics = await collectFinanceMetrics();

    res.json({
      message: 'Finance metrics retrieved successfully',
      metrics
    });
  } catch (error: any) {
    console.error('Error fetching finance metrics:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch finance metrics'
    });
  }
};

/**
 * Get finance alerts
 * GET /finance/monitoring/alerts
 */
export const getFinanceAlertsController = async (req: Request, res: Response) => {
  try {
    const alerts = await generateFinanceAlerts();

    res.json({
      message: 'Finance alerts retrieved successfully',
      alerts,
      count: alerts.length
    });
  } catch (error: any) {
    console.error('Error fetching finance alerts:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch finance alerts'
    });
  }
};

/**
 * Run daily finance checks manually
 * POST /finance/monitoring/daily-checks
 */
export const runDailyFinanceChecksController = async (req: Request, res: Response) => {
  try {
    await runDailyFinanceChecks();

    res.json({
      message: 'Daily finance checks completed successfully'
    });
  } catch (error: any) {
    console.error('Error running daily finance checks:', error);
    res.status(500).json({
      message: error.message || 'Failed to run daily finance checks'
    });
  }
};

/**
 * Get finance system health status
 * GET /finance/monitoring/health
 */
export const getFinanceHealthController = async (req: Request, res: Response) => {
  try {
    const health = await getFinanceHealthStatus();

    // Set appropriate HTTP status based on health
    const statusCode = health.status === 'critical' ? 503 :
                      health.status === 'warning' ? 200 : 200;

    res.status(statusCode).json({
      message: 'Finance system health status retrieved',
      health
    });
  } catch (error: any) {
    console.error('Error fetching finance health status:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch finance health status'
    });
  }
};

/**
 * Create finance audit log entry
 * POST /finance/monitoring/audit-log
 */
export const createFinanceAuditLogController = async (req: Request, res: Response) => {
  try {
    const { action, entity_type, entity_id, old_values, new_values, metadata } = req.body;
    const user_id = (req.user as any)?.id;

    if (!action || !entity_type || !entity_id || !user_id) {
       res.status(400).json({
        message: 'Missing required fields: action, entity_type, entity_id, user_id'
      });
      return;
    }

    // Import the audit log function here to avoid circular dependency
    const { createFinanceAuditLog } = await import('../../services/finance/monitoring.service');

    await createFinanceAuditLog(
      action,
      entity_type,
      entity_id,
      user_id,
      old_values,
      new_values,
      metadata
    );

    res.json({
      message: 'Finance audit log created successfully'
    });
  } catch (error: any) {
    console.error('Error creating finance audit log:', error);
    res.status(500).json({
      message: error.message || 'Failed to create finance audit log'
    });
  }
};
