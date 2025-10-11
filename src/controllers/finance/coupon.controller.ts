import { Request, Response } from 'express';
import { Coupon, ICoupon } from '../../models/finance';

/**
 * Create a new coupon
 * POST /finance/coupons
 */
export const createCoupon = async (req: Request, res: Response) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      minOrderValue,
      maxDiscount,
      usageLimit,
      fundedBy,
      vendorId,
      applicableTo,
      applicableIds,
      startDate,
      endDate,
      isActive = true,
    } = req.body;

    const createdBy = (req.user as any)?.id;

    if (!code || !name || !type || !value || !fundedBy || !startDate || !endDate) {
       res.status(400).json({
        message: 'Missing required fields: code, name, type, value, fundedBy, startDate, endDate'
      });
      return;
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
       res.status(400).json({
        message: 'Coupon code already exists'
      });
      return;
    }

    // Validate vendor funding
    if (fundedBy === 'vendor' && !vendorId) {
       res.status(400).json({
        message: 'Vendor ID is required when funding by vendor'
      });
      return;
    }

    // Validate percentage coupons
    if (type === 'percentage' && (value < 0 || value > 100)) {
         res.status(400).json({
        message: 'Percentage value must be between 0 and 100'
      });
      return;
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      minOrderValue,
      maxDiscount,
      usageLimit,
      fundedBy,
      vendorId,
      applicableTo,
      applicableIds,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive,
      createdBy,
    });

    await coupon.save();

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon
    });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    res.status(500).json({
      message: error.message || 'Failed to create coupon'
    });
  }
};

/**
 * Get all coupons with filtering
 * GET /finance/coupons
 */
export const getCoupons = async (req: Request, res: Response) => {
  try {
    const {
      fundedBy,
      vendorId,
      isActive,
      applicableTo,
      page = 1,
      limit = 50,
      search
    } = req.query;

    const query: any = {};

    if (fundedBy) query.fundedBy = fundedBy;
    if (vendorId) query.vendorId = vendorId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (applicableTo) query.applicableTo = applicableTo;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const coupons = await Coupon.find(query)
      .populate('vendorId', 'name')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Coupon.countDocuments(query);

    res.json({
      message: 'Coupons retrieved successfully',
      coupons,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
        hasNext: skip + Number(limit) < total,
        hasPrev: Number(page) > 1,
      }
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch coupons'
    });
  }
};

/**
 * Get coupon by ID
 * GET /finance/coupons/:id
 */
export const getCouponById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id)
      .populate('vendorId', 'name')
      .populate('createdBy', 'fullName email');

    if (!coupon) {
       res.status(404).json({
        message: 'Coupon not found'
      });
      return;
    }

    res.json({
      message: 'Coupon retrieved successfully',
      coupon
    });
  } catch (error: any) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch coupon'
    });
  }
};

/**
 * Update coupon
 * PUT /finance/coupons/:id
 */
export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
         res.status(404).json({
        message: 'Coupon not found'
      });
      return;
    }

    // If updating code, check for uniqueness
    if (updateData.code && updateData.code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingCoupon) {
         res.status(400).json({
          message: 'Coupon code already exists'
        });
        return;
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Validate percentage coupons
    if (updateData.type === 'percentage' && updateData.value !== undefined) {
      if (updateData.value < 0 || updateData.value > 100) {
           res.status(400).json({
          message: 'Percentage value must be between 0 and 100'
        });
        return;
      }
    }

    // Update coupon
    Object.assign(coupon, updateData);
    await coupon.save();

    res.json({
      message: 'Coupon updated successfully',
      coupon
    });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    res.status(500).json({
      message: error.message || 'Failed to update coupon'
    });
  }
};

/**
 * Delete coupon
 * DELETE /finance/coupons/:id
 */
export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
       res.status(404).json({
        message: 'Coupon not found'
      });
      return;
    }

    res.json({
      message: 'Coupon deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({
      message: error.message || 'Failed to delete coupon'
    });
  }
};

/**
 * Toggle coupon active status
 * PATCH /finance/coupons/:id/toggle
 */
export const toggleCouponStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
       res.status(404).json({
        message: 'Coupon not found'
      });
      return;
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      coupon
    });
  } catch (error: any) {
    console.error('Error toggling coupon status:', error);
    res.status(500).json({
      message: error.message || 'Failed to toggle coupon status'
    });
  }
};

/**
 * Validate coupon for an order
 * POST /finance/coupons/validate
 */
export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const {
      code,
      orderAmount,
      vendorId,
      categoryIds = [],
      productIds = []
    } = req.body;

    if (!code) {
         res.status(400).json({
        message: 'Coupon code is required'
      });
      return;
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() })
      .populate('vendorId', 'name');

    if (!coupon) {
       res.status(404).json({
        message: 'Coupon not found',
        valid: false
      });
      return;
      }

    // Check if coupon is valid for current date and usage
    if (!coupon.isValid) {
       res.status(400).json({
        message: 'Coupon is not valid for use',
        valid: false,
        reason: !coupon.isActive ? 'inactive' :
                coupon.isExpired ? 'expired' :
                coupon.usedCount >= (coupon.usageLimit || Infinity) ? 'usage_limit_exceeded' : 'date_range'
      });
      return;
    }

    // Check minimum order value
    if (coupon.minOrderValue && orderAmount < coupon.minOrderValue) {
       res.status(400).json({
        message: `Minimum order value of ${coupon.minOrderValue} required`,
        valid: false,
        reason: 'min_order_value'
      });
      return;
    }

    // Check applicability
    if (coupon.applicableTo !== 'all') {
      let isApplicable = false;

      if (coupon.applicableTo === 'vendors' && coupon.applicableIds) {
        isApplicable = coupon.applicableIds.some(id => id.toString() === vendorId);
      } else if (coupon.applicableTo === 'categories' && categoryIds.length > 0) {
        isApplicable = coupon.applicableIds?.some(id =>
          categoryIds.includes(id.toString())
        ) || false;
      } else if (coupon.applicableTo === 'products' && productIds.length > 0) {
        isApplicable = coupon.applicableIds?.some(id =>
          productIds.includes(id.toString())
        ) || false;
      }

      if (!isApplicable) {
         res.status(400).json({
          message: 'Coupon not applicable to this order',
          valid: false,
          reason: 'not_applicable'
        });
        return;
      }
    }

    // Calculate discount amount
    let discountAmount = 0;

    if (coupon.type === 'percentage') {
      discountAmount = (orderAmount * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, orderAmount);
    } else if (coupon.type === 'free_shipping') {
      // For free shipping, discount would be delivery fee (handled in order calculation)
      discountAmount = 0;
    }

    res.json({
      message: 'Coupon is valid',
      valid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        discountAmount,
        fundedBy: coupon.fundedBy,
        vendorId: coupon.vendorId?._id,
        vendorName: (coupon.vendorId as any)?.name,
      }
    });
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      message: error.message || 'Failed to validate coupon'
    });
  }
};

/**
 * Increment coupon usage count
 * POST /finance/coupons/:id/use
 */
export const useCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
       res.status(404).json({
        message: 'Coupon not found'
      });
      return;
    }

    if (coupon.usedCount >= (coupon.usageLimit || Infinity)) {
       res.status(400).json({
        message: 'Coupon usage limit exceeded'
      });
      return;
    }

    coupon.usedCount += 1;
    await coupon.save();

    res.json({
      message: 'Coupon usage recorded successfully',
      usedCount: coupon.usedCount
    });
  } catch (error: any) {
    console.error('Error recording coupon usage:', error);
    res.status(500).json({
      message: error.message || 'Failed to record coupon usage'
    });
  }
};

/**
 * Get coupon statistics
 * GET /finance/coupons/:id/stats
 */
export const getCouponStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
       res.status(404).json({
        message: 'Coupon not found'
      });
      return;
    }

    const stats = {
      totalUses: coupon.usedCount,
      usageLimit: coupon.usageLimit,
      usagePercentage: coupon.usagePercentage,
      isActive: coupon.isActive,
      isValid: coupon.isValid,
      isExpired: coupon.isExpired,
      remainingUses: (coupon.usageLimit || Infinity) - coupon.usedCount,
      daysUntilExpiry: Math.ceil((coupon.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    };

    res.json({
      message: 'Coupon statistics retrieved successfully',
      stats
    });
  } catch (error: any) {
    console.error('Error fetching coupon statistics:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch coupon statistics'
    });
  }
};
