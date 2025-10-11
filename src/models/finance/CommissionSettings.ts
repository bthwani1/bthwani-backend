import mongoose, { Schema, Document } from 'mongoose';

export interface ICommissionRates {
  platformItemsCommission: number; // نسبة المنصة من العناصر
  platformDeliveryCommission: number; // نسبة المنصة من رسوم التوصيل
  driverDeliveryShare: number; // نسبة السائق من رسوم التوصيل
  vendorCommission: number; // نسبة المتجر من العناصر
  tipsDistribution: 'driver' | 'platform' | 'split'; // توزيع الإكرامية
  tipsSplitRatio?: number; // نسبة تقسيم الإكرامية إذا كان split
  taxEnabled: boolean;
  taxRate: number; // نسبة الضريبة
  taxBase: 'subtotal' | 'delivery' | 'total'; // أساس حساب الضريبة
}

export interface ICommissionSettings extends Document {
  rates: ICommissionRates;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  version: number;
  createdBy: mongoose.Types.ObjectId;
  reason?: string; // سبب التعديل
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommissionAuditLog extends Document {
  settingsId: mongoose.Types.ObjectId;
  action: 'create' | 'update' | 'activate' | 'deactivate';
  oldValues?: Partial<ICommissionRates>;
  newValues?: ICommissionRates;
  changedBy: mongoose.Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

const CommissionRatesSchema = new Schema<ICommissionRates>({
  platformItemsCommission: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  platformDeliveryCommission: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  driverDeliveryShare: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  vendorCommission: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  tipsDistribution: {
    type: String,
    enum: ['driver', 'platform', 'split'],
    required: true,
  },
  tipsSplitRatio: {
    type: Number,
    min: 0,
    max: 100,
  },
  taxEnabled: {
    type: Boolean,
    required: true,
    default: false,
  },
  taxRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 15,
  },
  taxBase: {
    type: String,
    enum: ['subtotal', 'delivery', 'total'],
    required: true,
    default: 'total',
  },
});

const CommissionSettingsSchema = new Schema<ICommissionSettings>({
  rates: {
    type: CommissionRatesSchema,
    required: true,
  },
  effectiveFrom: {
    type: Date,
    required: true,
  },
  effectiveTo: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'AdminUser',
  },
  reason: String,
}, {
  timestamps: true,
});

// Add validation to ensure platform + driver delivery shares = 100%
CommissionSettingsSchema.pre('save', function(next) {
  const rates = this.rates as ICommissionRates;
  if (rates.platformDeliveryCommission + rates.driverDeliveryShare !== 100) {
    next(new Error('مجموع نسبة المنصة والسائق من التوصيل يجب أن يساوي 100%'));
  } else {
    next();
  }
});

const CommissionAuditLogSchema = new Schema<ICommissionAuditLog>({
  settingsId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'CommissionSettings',
  },
  action: {
    type: String,
    enum: ['create', 'update', 'activate', 'deactivate'],
    required: true,
  },
  oldValues: CommissionRatesSchema,
  newValues: CommissionRatesSchema,
  changedBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'AdminUser',
  },
  reason: String,
}, {
  timestamps: true,
});

// Indexes for better performance
CommissionSettingsSchema.index({ isActive: 1, effectiveFrom: 1, effectiveTo: 1 });
CommissionSettingsSchema.index({ version: -1 });
CommissionAuditLogSchema.index({ settingsId: 1, createdAt: -1 });

export const CommissionSettings = mongoose.model<ICommissionSettings>('CommissionSettings', CommissionSettingsSchema);
export const CommissionAuditLog = mongoose.model<ICommissionAuditLog>('CommissionAuditLog', CommissionAuditLogSchema);
