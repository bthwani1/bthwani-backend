// src/models/delivry_Marketplace_V1/DeliveryStore.ts
import mongoose, { Schema, Document } from "mongoose";

interface IWorkSchedule {
  day: string;
  open: boolean;
  from?: string;
  to?: string;
}

export type StoreUsageType =
  | "restaurant"
  | "grocery"
  | "pharmacy"
  | "bakery"
  | "cafe"
  | "other";

export interface IDeliveryStore extends Document {
  name: string;
  address: string;
  category: mongoose.Types.ObjectId;
  // احتفظت بـ lat/lng كما هي لتوافق مشروعك
  location: { lat: number; lng: number };

  // جديد (اختياري): نسخة GeoJSON لو حبيت تستخدم 2dsphere
  geo?: { type: "Point"; coordinates: [number, number] };

  isActive: boolean;
  image?: string;
  logo?: string;
  forceClosed: boolean;
  forceOpen: boolean;
  schedule: IWorkSchedule[];
  commissionRate: number;
  takeCommission: boolean;
  isTrending: boolean;
  isFeatured: boolean;
  // ... حقولك السابقة
  createdByMarketerUid: { type: String; index: true }; // UID من Firebase
  participants: [
    {
      marketerId: String;
      role: { type: String; enum: ["lead", "support"]; default: "lead" };
      weight: { type: Number; default: 0.5 };
    }
  ];

  // جديد: وسم/تصنيف المتجر + فلاتر
  tags: string[];

  // جديد: تقييمات
  rating?: number; // متوسط
  ratingsCount?: number; // عدد التقييمات

  // جديد: تقدير التجهيز والطابور
  avgPrepTimeMin?: number; // متوسط تجهيز افتراضي
  pendingOrders?: number; // أو queueSize

  // جديد (اختياري): نوع المتجر لتفادي populate
  usageType?: StoreUsageType;

  // تتبّع مصدر الإنشاء
  source: "marketerQuickOnboard" | "admin" | "other";
  createdByUid: string; // uid من Firebase للمسوّق الذي أنشأ المتجر
  // إعدادات التسعير
  pricingStrategy?: mongoose.Types.ObjectId | null;
  pricingStrategyType: string;

  // جديد (اختياري): إعدادات توصيل
  deliveryRadiusKm?: number;
  deliveryBaseFee?: number;
  deliveryPerKmFee?: number;
  minOrderAmount?: number;

  glPayableAccount: mongoose.Types.ObjectId;
}

const storeSchema = new Schema<IDeliveryStore>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryCategory",
      required: true,
    },

    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    // اختياري: GeoJSON لفهرس 2dsphere
    geo: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], index: "2dsphere", default: undefined }, // [lng, lat]
    },

    commissionRate: { type: Number, default: 0 },
    takeCommission: { type: Boolean, default: true },

    isTrending: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    // تتبّع مصدر الإنشاء
    createdByMarketerUid: { type: String }, // uid من Firebase للمسوّق الذي أنشأ المتجر
    participants: [
      {
        marketerId: { type: String, required: true },
        role: { type: String, enum: ["lead", "support"], default: "lead" },
        weight: { type: Number, default: 0.5 },
      },
    ],
    source: {
      type: String,
      enum: ["marketerQuickOnboard", "admin", "other"],
      default: "marketerQuickOnboard",
    },

    // فلاتر/وسوم للواجهة (فطور/غداء/عشاء/سريع...)
    tags: { type: [String], default: [] },

    // تقييمات
    rating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },

    // تجهيز + طابور (لـ estimateOrderTiming)
    avgPrepTimeMin: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },

    // نوع المتجر (بديل عن أخذ usageType من الفئة)
    usageType: {
      type: String,
      enum: ["restaurant", "grocery", "pharmacy", "bakery", "cafe", "other"],
      default: "restaurant",
    },

    pricingStrategy: {
      type: Schema.Types.ObjectId,
      ref: "PricingStrategy",
      default: null,
    },
    pricingStrategyType: {
      type: String,
      enum: ["auto", "manual", ""],
      default: "",
    },

    // توصيل (اختياري)
    deliveryRadiusKm: { type: Number, default: 0 },
    deliveryBaseFee: { type: Number, default: 0 },
    deliveryPerKmFee: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },

    glPayableAccount: { type: Schema.Types.ObjectId, ref: "ChartAccount" },

    isActive: { type: Boolean, default: true },
    image: { type: String },
    logo: { type: String },
    forceClosed: { type: Boolean, default: false },
    forceOpen: { type: Boolean, default: false },

    schedule: [
      {
        day: { type: String, required: true },
        open: { type: Boolean, default: false },
        from: String,
        to: String,
      },
    ],
  },
  { timestamps: true }
);

// فهارس مفيدة
storeSchema.index({ isActive: 1, category: 1 });
storeSchema.index({ name: "text", address: "text" });

// لو استخدمت GeoJSON: حفظ [lng, lat] تلقائيًا من location
storeSchema.pre("save", function (next) {
  if (this.location?.lng != null && this.location?.lat != null) {
    this.geo = {
      type: "Point",
      coordinates: [this.location.lng, this.location.lat],
    } as any;
  }
  next();
});

export default mongoose.model<IDeliveryStore>("DeliveryStore", storeSchema);
// ========= Indexes =========

// 1) نصّي مُوزَّن (للبحث عن طريق الاسم/الوسوم/العنوان)
//    ملاحظة: هذا يحل محل index القديم: storeSchema.index({ name: "text", address: "text" });
storeSchema.index(
  { name: "text", tags: "text", address: "text" },
  {
    weights: { name: 10, tags: 5, address: 2 },
    name: "store_text_index",
    // لو حاب تقصر نتائج البحث على المتاجر الفعالة فقط:
    // partialFilterExpression: { isActive: true },
  }
);

// 2) فهرس جغرافي (للأقرب)
// إذا كنت قد وضعت index: "2dsphere" على geo.coordinates في تعريف الحقل (كما في الكود لديك) فذلك يكفي.
// إن رغبت نقل الفهرس لمستوى السكيمـا، استخدم السطر التالي واحذف index من تعريف الحقل لتفادي التكرار:
// storeSchema.index({ geo: "2dsphere" }, { name: "geo_2dsphere" });

// 3) فلاتر سريعة حسب الفئة والحالة
storeSchema.index({ isActive: 1, category: 1 }, { name: "active_by_category" });

// 4) "الجديدة" (الترتيب الأحدث بين المتاجر الفعالة)
storeSchema.index({ isActive: 1, createdAt: -1 }, { name: "active_newest" });

// 5) ترتيب افتراضي بالجودة/التقييم
storeSchema.index(
  { isActive: 1, rating: -1, ratingsCount: -1 },
  { name: "active_rating_rank" }
);

// 6) دعم استعلامات بحسب نوع الاستخدام (اختياري لكنه مفيد للفلترة السريعة)
storeSchema.index({ usageType: 1, isActive: 1 }, { name: "usage_active" });

// 7) للبحث/التجميع حسب المشاركين/المسوّقين (إن كنت تحتاج ذلك في لوحات الإدارة)
storeSchema.index({ "participants.uid": 1 }, { name: "by_participant_uid" });

// 8) إبراز/ترند (إن كنت تعرض تبويب "المميّزة" أو "الرائجة")
storeSchema.index({ isActive: 1, isFeatured: 1 }, { name: "active_featured" });
storeSchema.index({ isActive: 1, isTrending: 1 }, { name: "active_trending" });

// 9) وسوم للفلترة (غير ضروري دائماً لأن النصّي يغطيها، لكن مفيد لو تعمل exact match على الوسوم)
storeSchema.index({ tags: 1 }, { name: "tags_scalar" });

// 10) فهارس للفلاتر الجديدة
storeSchema.index({ isTrending: 1 }, { name: "isTrending_index" });
storeSchema.index(
  { deliveryBaseFee: 1, freeDelivery: 1 },
  { name: "delivery_fee_index" }
);
storeSchema.index(
  { rating: -1, ratingsCount: -1 },
  { name: "rating_rank_index" }
);
storeSchema.index({ createdByMarketerUid: 1, createdAt: -1 });
storeSchema.index({ "geo": "2dsphere" });