import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number; // Percentage (0-100) or fixed amount
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  fundedBy: 'platform' | 'vendor';
  vendorId?: mongoose.Types.ObjectId; // If funded by vendor
  applicableTo: 'all' | 'categories' | 'products' | 'vendors';
  applicableIds?: mongoose.Types.ObjectId[]; // Category/product/vendor IDs
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // Virtual properties
  isValid: boolean;
  isExpired: boolean;
  usagePercentage: number;
}

const CouponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderValue: {
    type: Number,
    min: 0,
  },
  maxDiscount: {
    type: Number,
    min: 0,
  },
  usageLimit: {
    type: Number,
    min: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  fundedBy: {
    type: String,
    enum: ['platform', 'vendor'],
    required: true,
  },
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: 'DeliveryStore',
  },
  applicableTo: {
    type: String,
    enum: ['all', 'categories', 'products', 'vendors'],
    required: true,
    default: 'all',
  },
  applicableIds: [{
    type: Schema.Types.ObjectId,
    refPath: 'applicableTo', // Dynamic reference based on applicableTo
  }],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'AdminUser',
  },
}, {
  timestamps: true,
});

// Indexes for better performance
CouponSchema.index({ code: 1 });
CouponSchema.index({ fundedBy: 1, vendorId: 1 });
CouponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
CouponSchema.index({ applicableTo: 1, applicableIds: 1 });

// Pre-save validation
CouponSchema.pre('save', function(next) {
  // Validate percentage coupons
  if (this.type === 'percentage' && (this.value < 0 || this.value > 100)) {
    next(new Error('Percentage value must be between 0 and 100'));
  }

  // Validate date range
  if (this.startDate >= this.endDate) {
    next(new Error('Start date must be before end date'));
  }

  // Validate usage limit vs used count
  if (this.usageLimit && this.usedCount > this.usageLimit) {
    next(new Error('Used count cannot exceed usage limit'));
  }

  next();
});

// Virtual for checking if coupon is valid for use
CouponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive &&
         this.usedCount < (this.usageLimit || Infinity) &&
         now >= this.startDate &&
         now <= this.endDate;
});

// Virtual for checking if coupon is expired
CouponSchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate;
});

// Virtual for usage percentage
CouponSchema.virtual('usagePercentage').get(function() {
  if (!this.usageLimit) return 0;
  return Math.round((this.usedCount / this.usageLimit) * 100);
});

export default mongoose.model<ICoupon>('Coupon', CouponSchema);
