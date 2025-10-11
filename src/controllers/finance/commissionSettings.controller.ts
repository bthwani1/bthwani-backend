import { Request, Response } from 'express';
import { CommissionSettings, CommissionAuditLog, ICommissionRates } from '../../models/finance';

/**
 * Get current active commission settings
 * GET /finance/commissions/settings
 */
export const getCurrentCommissionSettings = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();

    const settings = await CommissionSettings.findOne({
      isActive: true,
      effectiveFrom: { $lte: currentDate },
      $or: [
        { effectiveTo: { $exists: false } },
        { effectiveTo: { $gte: currentDate } }
      ]
    }).populate('createdBy', 'fullName email').sort({ version: -1 });

    if (!settings) {
       res.status(404).json({
        message: 'No active commission settings found',
        settings: null
      });
      return;
    }

    res.json({
      message: 'Current commission settings retrieved successfully',
      settings: settings
    });
  } catch (error: any) {
    console.error('Error fetching commission settings:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch commission settings'
    });
  }
};

/**
 * Create new commission settings
 * POST /finance/commissions/settings
 */
export const createCommissionSettings = async (req: Request, res: Response) => {
  try {
    const {
      rates,
      effectiveFrom,
      reason
    } = req.body;

    const createdBy = (req.user as any)?.id;

    if (!rates || !effectiveFrom) {
       res.status(400).json({
        message: 'Missing required fields: rates, effectiveFrom'
      });
      return;
    }

    // Deactivate current settings
    await CommissionSettings.updateMany(
      { isActive: true },
      { isActive: false, effectiveTo: new Date() }
    );

    // Get next version number
    const lastSettings = await CommissionSettings.findOne().sort({ version: -1 });
    const nextVersion = lastSettings ? lastSettings.version + 1 : 1;

    // Create new settings
    const newSettings = new CommissionSettings({
      rates,
      effectiveFrom: new Date(effectiveFrom),
      isActive: true,
      version: nextVersion,
      createdBy,
      reason
    });

    await newSettings.save();

    // Create audit log
    await CommissionAuditLog.create({
      settingsId: newSettings._id,
      action: 'create',
      newValues: rates,
      changedBy: createdBy,
      reason
    });

    // Invalidate cache
    await invalidateCommissionCache();

    res.status(201).json({
      message: 'Commission settings created successfully',
      settings: newSettings
    });
  } catch (error: any) {
    console.error('Error creating commission settings:', error);
    res.status(500).json({
      message: error.message || 'Failed to create commission settings'
    });
  }
};

/**
 * Update existing commission settings
 * PUT /finance/commissions/settings/:id
 */
export const updateCommissionSettings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      rates,
      reason
    } = req.body;

    const changedBy = (req.user as any)?.id;

    if (!rates) {
       res.status(400).json({
        message: 'Missing required fields: rates'
      });
      return;
    }

    const currentSettings = await CommissionSettings.findById(id);
    if (!currentSettings) {
       res.status(404).json({
        message: 'Commission settings not found'
      });
      return;
    }

    // Create audit log entry before updating
    await CommissionAuditLog.create({
      settingsId: currentSettings._id,
      action: 'update',
      oldValues: currentSettings.rates,
      newValues: rates,
      changedBy,
      reason
    });

    // Update settings
    currentSettings.rates = rates;
    currentSettings.reason = reason;
    await currentSettings.save();

    // Invalidate cache
    await invalidateCommissionCache();

    res.json({
      message: 'Commission settings updated successfully',
      settings: currentSettings
    });
  } catch (error: any) {
    console.error('Error updating commission settings:', error);
    res.status(500).json({
      message: error.message || 'Failed to update commission settings'
    });
  }
};

/**
 * Get commission settings audit log
 * GET /finance/commissions/audit-log
 */
export const getCommissionAuditLog = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const logs = await CommissionAuditLog.find()
      .populate('changedBy', 'fullName email')
      .populate('settingsId')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    const total = await CommissionAuditLog.countDocuments();

    res.json({
      message: 'Commission audit log retrieved successfully',
      logs,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: total > Number(offset) + Number(limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching commission audit log:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch commission audit log'
    });
  }
};

/**
 * Get all commission settings (for history)
 * GET /finance/commissions/settings/history
 */
export const getCommissionSettingsHistory = async (req: Request, res: Response) => {
  try {
    const settings = await CommissionSettings.find()
      .populate('createdBy', 'fullName email')
      .sort({ version: -1 });

    res.json({
      message: 'Commission settings history retrieved successfully',
      settings
    });
  } catch (error: any) {
    console.error('Error fetching commission settings history:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch commission settings history'
    });
  }
};

/**
 * Calculate commission preview for an order
 * POST /finance/commissions/calculate-preview
 */
export const calculateCommissionPreview = async (req: Request, res: Response) => {
  try {
    const {
      itemsAmount,
      deliveryFee,
      tipAmount = 0,
      couponAmount = 0,
      couponFundedBy = 'platform'
    } = req.body;

    if (!itemsAmount || !deliveryFee) {
       res.status(400).json({
        message: 'Missing required fields: itemsAmount, deliveryFee'
      });
      return;
    }

    // Get current commission settings
    const currentDate = new Date();
    const settings = await CommissionSettings.findOne({
      isActive: true,
      effectiveFrom: { $lte: currentDate },
      $or: [
        { effectiveTo: { $exists: false } },
        { effectiveTo: { $gte: currentDate } }
      ]
    });

    if (!settings) {
       res.status(404).json({
        message: 'No active commission settings found'
      });
      return;
    }

    const rates = settings.rates;

    // Calculate vendor payout (after vendor commission)
    const vendorCommission = (itemsAmount - couponAmount) * (rates.vendorCommission / 100);
    const vendorPayout = itemsAmount - couponAmount - vendorCommission;

    // Calculate delivery fee split
    const platformDeliveryCommission = deliveryFee * (rates.platformDeliveryCommission / 100);
    const driverDeliveryShare = deliveryFee * (rates.driverDeliveryShare / 100);

    // Calculate tip distribution
    let platformTipShare = 0;
    let driverTipShare = tipAmount;

    if (rates.tipsDistribution === 'platform') {
      platformTipShare = tipAmount;
      driverTipShare = 0;
    } else if (rates.tipsDistribution === 'split' && rates.tipsSplitRatio) {
      driverTipShare = tipAmount * (rates.tipsSplitRatio / 100);
      platformTipShare = tipAmount * ((100 - rates.tipsSplitRatio) / 100);
    }

    // Calculate tax if enabled
    let taxAmount = 0;
    let taxBaseAmount = 0;

    if (rates.taxEnabled) {
      if (rates.taxBase === 'subtotal') {
        taxBaseAmount = itemsAmount - couponAmount;
      } else if (rates.taxBase === 'delivery') {
        taxBaseAmount = deliveryFee;
      } else { // total
        taxBaseAmount = itemsAmount - couponAmount + deliveryFee;
      }
      taxAmount = taxBaseAmount * (rates.taxRate / 100);
    }

    // Platform total revenue
    const platformItemsCommission = (itemsAmount - couponAmount) * (rates.platformItemsCommission / 100);
    const platformTotalRevenue = platformItemsCommission + platformDeliveryCommission + platformTipShare + taxAmount;

    // If coupon is funded by platform, subtract from revenue
    const netPlatformRevenue = couponFundedBy === 'platform'
      ? platformTotalRevenue - couponAmount
      : platformTotalRevenue;

    const calculation = {
      settings: {
        version: settings.version,
        effectiveFrom: settings.effectiveFrom,
      },
      breakdown: {
        vendor: {
          itemsAmount,
          couponAmount,
          couponFundedBy,
          vendorCommission,
          vendorPayout,
        },
        delivery: {
          deliveryFee,
          platformDeliveryCommission,
          driverDeliveryShare,
        },
        tips: {
          tipAmount,
          distribution: rates.tipsDistribution,
          platformTipShare,
          driverTipShare,
        },
        tax: {
          enabled: rates.taxEnabled,
          rate: rates.taxRate,
          base: rates.taxBase,
          amount: taxAmount,
        },
        platform: {
          itemsCommission: platformItemsCommission,
          deliveryCommission: platformDeliveryCommission,
          tipShare: platformTipShare,
          taxAmount,
          couponCost: couponFundedBy === 'platform' ? couponAmount : 0,
          totalRevenue: platformTotalRevenue,
          netRevenue: netPlatformRevenue,
        },
      },
      summary: {
        vendorTotal: vendorPayout,
        driverTotal: driverDeliveryShare + driverTipShare,
        platformTotal: netPlatformRevenue,
        totalOrderValue: itemsAmount + deliveryFee + tipAmount,
      }
    };

    res.json({
      message: 'Commission calculation preview generated successfully',
      calculation
    });
  } catch (error: any) {
    console.error('Error calculating commission preview:', error);
    res.status(500).json({
      message: error.message || 'Failed to calculate commission preview'
    });
  }
};

/**
 * Invalidate commission cache
 */
async function invalidateCommissionCache(): Promise<void> {
  // This would integrate with your caching system (Redis, etc.)
  // For now, we'll just log the action
  console.log('Invalidating commission cache...');
}
