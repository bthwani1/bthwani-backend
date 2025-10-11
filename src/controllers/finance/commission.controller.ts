import { Request, Response } from 'express';
import {
  createCommissionRule,
  calculateCommission,
  applyCommissionToOrder,
  getCommissionReport
} from '../../services/finance/commission.service';
import { CommissionRule } from '../../models/finance';

/**
 * Create a new commission rule
 * POST /finance/commissions/rules
 */
export const createCommissionRuleController = async (req: Request, res: Response) => {
  try {
    const {
      applicable_to,
      basis,
      value,
      min,
      max,
      effective_from,
      effective_to,
      priority
    } = req.body;

    const created_by = (req.user as any)?.id;

    if (!applicable_to || !basis || !value || !effective_from) {
       res.status(400).json({
        message: 'Missing required fields: applicable_to, basis, value, effective_from'
      });
      return;
    }

    if (!['driver', 'vendor'].includes(applicable_to)) {
       res.status(400).json({
        message: 'applicable_to must be either "driver" or "vendor"'
      });
      return;
    }

    if (!['percentage', 'flat'].includes(basis)) {
       res.status(400).json({
        message: 'basis must be either "percentage" or "flat"'
      });
      return;
    }

    const rule = await createCommissionRule({
      applicable_to,
      basis,
      value,
      min,
      max,
      effective_from: new Date(effective_from),
      effective_to: effective_to ? new Date(effective_to) : undefined,
      priority,
      created_by
    });

    res.status(201).json({
      message: 'Commission rule created successfully',
      rule
    });
  } catch (error: any) {
    console.error('Error creating commission rule:', error);
    res.status(500).json({
      message: error.message || 'Failed to create commission rule'
    });
  }
};

/**
 * Get all commission rules
 * GET /finance/commissions/rules
 */
export const getCommissionRules = async (req: Request, res: Response) => {
  try {
    const rules = await CommissionRule.find({})
      .populate('created_by', 'fullName email')
      .sort({ applicable_to: 1, priority: -1 });

    res.json({
      rules,
      count: rules.length
    });
  } catch (error: any) {
    console.error('Error fetching commission rules:', error);
    res.status(500).json({ message: 'Failed to fetch commission rules' });
  }
};

/**
 * Calculate commission for an order (preview)
 * POST /finance/commissions/calculate
 */
export const calculateCommissionController = async (req: Request, res: Response) => {
  try {
    const {
      order_amount,
      entity_type,
      entity_id,
      order_date
    } = req.body;

    if (!order_amount || !entity_type || !entity_id) {
       res.status(400).json({
        message: 'Missing required fields: order_amount, entity_type, entity_id'
      });
      return;
    }

    if (!['driver', 'vendor'].includes(entity_type)) {
       res.status(400).json({
        message: 'entity_type must be either "driver" or "vendor"'
      });
      return;
    }

    const commission = await calculateCommission(
      order_amount,
      entity_type,
      entity_id,
      order_date ? new Date(order_date) : new Date()
    );

    res.json({
      message: 'Commission calculated successfully',
      commission
    });
  } catch (error: any) {
    console.error('Error calculating commission:', error);
        res.status(400).json({
      message: error.message || 'Failed to calculate commission'
    });
  }
};

/**
 * Apply commission to an order
 * POST /finance/commissions/apply
 */
export const applyCommissionController = async (req: Request, res: Response) => {
  try {
    const {
      order_id,
      order_amount,
      driver_id,
      vendor_id,
      entity_type,
      entity_id
    } = req.body;

    if (!order_id || !order_amount || !driver_id || !vendor_id || !entity_type || !entity_id) {
       res.status(400).json({
        message: 'Missing required fields: order_id, order_amount, driver_id, vendor_id, entity_type, entity_id'
      });
      return;
    }

    if (!['driver', 'vendor'].includes(entity_type)) {
       res.status(400).json({
        message: 'entity_type must be either "driver" or "vendor"'
      });
      return;
    }

    const application = await applyCommissionToOrder(
      order_id,
      order_amount,
      driver_id,
      vendor_id,
      entity_type,
      entity_id
    );

    res.json({
      message: 'Commission applied successfully',
      application
    });
  } catch (error: any) {
    console.error('Error applying commission:', error);
    res.status(500).json({
      message: error.message || 'Failed to apply commission'
    });
  }
};

/**
 * Get commission report for a period
 * GET /finance/commissions/report
 */
export const getCommissionReportController = async (req: Request, res: Response) => {
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

    const report = await getCommissionReport(
      startDate,
      endDate,
      entity_type as 'driver' | 'vendor' | undefined
    );

    res.json({
      message: 'Commission report generated successfully',
      report
    });
  } catch (error: any) {
    console.error('Error generating commission report:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate commission report'
    });
  }
};
