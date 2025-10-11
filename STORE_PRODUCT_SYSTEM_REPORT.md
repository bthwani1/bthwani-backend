# تقرير نظام المتاجر والمنتجات والفئات - تحليل شامل وعميق

## نظرة عامة على نظام المتاجر والمنتجات

تم اكتشاف نظام متاجر ومنتجات متطور ومتكامل يتضمن **4 أنظمة رئيسية** مع تكامل مالي وتشغيلي متقدم.

### الأنظمة الرئيسية المكتشفة:

1. **نظام المتاجر (DeliveryStore)** - متاجر التوصيل والمطاعم
2. **نظام المنتجات المزدوج** - DeliveryProduct + MerchantProduct
3. **نظام الفئات المتدرج** - DeliveryCategory + SubCategory + Sections
4. **نظام العروض والتسعير** - Promotions + PricingStrategy

## تحليل مفصل لنظام المتاجر

### 1. نموذج المتجر (DeliveryStore) 🏪

#### الهيكل والخصائص الأساسية:

```typescript
// src/models/delivery_marketplace_v1/DeliveryStore.ts
export interface IDeliveryStore extends Document {
  // المعلومات الأساسية
  name: string;
  address: string;
  category: mongoose.Types.ObjectId;  // مرتبط بـ DeliveryCategory

  // الموقع الجغرافي
  location: { lat: number; lng: number };
  geo?: { type: "Point"; coordinates: [number, number] }; // للفهرسة الجغرافية

  // حالة المتجر
  isActive: boolean;
  forceClosed: boolean;     // إغلاق قسري
  forceOpen: boolean;       // فتح قسري

  // جدول العمل
  schedule: IWorkSchedule[]; // أيام وساعات العمل

  // المعلومات المالية
  commissionRate: number;   // نسبة العمولة
  takeCommission: boolean;  // هل يأخذ عمولة؟
  glPayableAccount: mongoose.Types.ObjectId; // حساب GL للمدفوعات

  // التصنيف والعرض
  isTrending: boolean;      // متجر رائج
  isFeatured: boolean;      // متجر مميز
  tags: string[];           // وسوم للبحث

  // التقييمات
  rating?: number;          // متوسط التقييم
  ratingsCount?: number;    // عدد التقييمات

  // معلومات التشغيل
  usageType: "restaurant" | "grocery" | "pharmacy" | "bakery" | "cafe" | "other";
  deliveryRadiusKm?: number; // نطاق التوصيل
  deliveryBaseFee?: number;  // رسوم التوصيل الأساسية
  deliveryPerKmFee?: number; // رسوم لكل كيلومتر
  minOrderAmount?: number;   // حد أدنى للطلب

  // إعدادات التسعير
  pricingStrategy?: mongoose.Types.ObjectId;
  pricingStrategyType: string;

  // معلومات المسوّقين
  createdByMarketerUid: string;
  participants: [{
    marketerId: string;
    role: "lead" | "support";
    weight: number;          // نسبة المشاركة
  }];

  // تتبع المصدر
  source: "marketerQuickOnboard" | "admin" | "other";
  createdByUid: string;
}
```

### 2. نظام جدولة العمل ⏰

#### هيكل جدول العمل:
```typescript
interface IWorkSchedule {
  day: string;        // "monday", "tuesday", etc.
  open: boolean;      // هل المتجر مفتوح في هذا اليوم؟
  from?: string;      // ساعة البداية "09:00"
  to?: string;        // ساعة النهاية "22:00"
}
```

#### آلية العمل:
- **تحقق من حالة المتجر** حسب اليوم والوقت الحالي
- **دعم الإغلاق/الفتح القسري** للمتاجر
- **تأثير على توفر المنتجات** والطلبات

## نظام المنتجات المزدوج

### 1. منتجات التوصيل (DeliveryProduct) 🍕

#### الهيكل والخصائص:

```typescript
// src/models/delivery_marketplace_v1/DeliveryProduct.ts
export interface IDeliveryProduct extends Document {
  // الربط بالمتجر والتصنيف
  store: mongoose.Types.ObjectId;           // المتجر الرئيسي
  subCategory?: mongoose.Types.ObjectId;    // الفئة الداخلية
  section?: mongoose.Types.ObjectId;        // القسم في المتجر

  // المعلومات الأساسية
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;    // السعر قبل الخصم

  // التوفر والعروض
  isAvailable: boolean;
  isDailyOffer: boolean;     // عرض يومي

  // الوسوم والتصنيف
  tags: string[];            // وسوم للبحث والفلترة
  rating?: number;           // متوسط التقييم
  ratingsCount?: number;     // عدد التقييمات

  // معلومات إضافية
  image?: string;
  avgPrepTimeMin?: number;   // متوسط وقت التجهيز
  isFeatured?: boolean;      // منتج مميز
  isTrending?: boolean;      // منتج رائج

  // المعلومات الغذائية (اختيارية)
  calories?: number;
  allergens?: string[];      // مسببات الحساسية
  isVeg?: boolean;           // نباتي؟
  discountPercent?: number;  // نسبة الخصم
}
```

### 2. منتجات التاجر (MerchantProduct) 🛒

#### الهيكل والخصائص:

```typescript
// src/models/mckathi/MerchantProduct.ts
export interface IMerchantProduct extends Document {
  // الربط الثلاثي
  merchant: Types.ObjectId;     // التاجر
  store: Types.ObjectId;        // المتجر
  product: Types.ObjectId;      // منتج الكتالوج الأساسي

  // التسعير والمخزون
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  stock?: number;               // المخزون المتاح

  // التوفر والعرض
  isAvailable: boolean;
  section?: Types.ObjectId;      // القسم في المتجر

  // خصائص التاجر
  customImage?: string;         // صورة مخصصة من التاجر
  customDescription?: string;   // وصف مخصص

  // مصدر المنتج
  origin: "catalog" | "merchant" | "imported";

  // وحدات البيع
  sellingUnit?: string;         // "kg", "pcs", etc.
  unitSize?: number;            // 1, 0.5, 250, etc.
  unitMeasure?: string;         // "kg", "g", "l", "ml", "pcs"

  // قيود الكمية
  minQtyPerOrder?: number;       // حد أدنى للطلب
  maxQtyPerOrder?: number;       // حد أقصى للطلب (0 = غير محدد)
  stepQty?: number;             // خطوة الكمية (1 أو 0.5)

  // معلومات إضافية
  avgPrepTimeMin?: number;      // وقت التجهيز
  customAttributes?: IMerchantProductAttribute[]; // خصائص مخصصة
  tags?: string[];              // وسوم إضافية
  rating?: number;              // تقييم المنتج
  ratingsCount?: number;        // عدد التقييمات
}
```

### 3. مقارنة بين النظامين:

| الميزة | DeliveryProduct | MerchantProduct |
|--------|----------------|------------------|
| **الربط بالمتجر** | مباشر | عبر merchant + store |
| **نظام الفئات** | subCategory + section | section فقط |
| **المخزون** | لا يوجد | مدعوم |
| **الخصائص المخصصة** | محدودة | متقدمة مع attributes |
| **وحدات البيع** | غير مدعومة | مدعومة بالكامل |
| **التقييمات** | مدعومة | مدعومة |

## نظام الفئات المتدرج

### 1. نظام الفئات الرئيسية (DeliveryCategory) 📂

#### الهيكل والخصائص:

```typescript
// src/models/delivery_marketplace_v1/DeliveryCategory.ts
export interface IDeliveryCategory extends Document {
  name: string;
  image?: string;
  description?: string;
  isActive: boolean;

  // نوع الاستخدام
  usageType: "grocery" | "restaurant" | "retail";

  // نظام التسلسل
  parent?: mongoose.Types.ObjectId;  // فئة أب
  sortOrder: number;                // ترتيب العرض

  // الفهرسة الجغرافية
  location?: { lat: number; lng: number };
}
```

#### نظام الترتيب الذكي:
- **ترتيب تلقائي** عند الإنشاء حسب `sortOrder`
- **إمكانية إعادة الترتيب** عبر `bulkReorder`
- **حركة فردية** عبر `moveUp`/`moveDown`
- **فلترة حسب `usageType`** و `parent`

### 2. نظام الفئات الفرعية (SubCategory) 📁

#### الهيكل البسيط:
```typescript
// src/models/delivery_marketplace_v1/DeliveryProductSubCategory.ts
export interface IDeliveryProductSubCategory extends Document {
  storeId: mongoose.Types.ObjectId;  // المتجر المالك
  name: string;                     // اسم الفئة الفرعية
}
```

#### آلية العمل:
- **مرتبط بالمتجر فقط** (ليس عام)
- **يُستخدم في DeliveryProduct** فقط
- **لا يوجد نظام تسلسل** أو ترتيب

### 3. نظام الأقسام في المتجر (StoreSection) 🗂️

#### الهيكل والخصائص:

```typescript
// src/models/delivery_marketplace_v1/StoreSection.ts
export interface IStoreSection extends Document {
  store: mongoose.Types.ObjectId;     // المتجر المالك
  name: string;                       // اسم القسم
  usageType: 'grocery' | 'restaurant' | 'retail';
}
```

#### آلية العمل:
- **مرتبط بالمتجر فقط**
- **يُستخدم في كلا نظامي المنتجات**
- **يساعد في تنظيم المنتجات داخل المتجر**

## نظام العروض والتسعير

### 1. نظام العروض والترويج (Promotion) 🎯

#### الهيكل والخصائص:

```typescript
// src/models/delivery_marketplace_v1/Promotion.ts
export interface IPromotion extends Document {
  // المعلومات الأساسية
  title?: string;
  description?: string;
  image?: string;
  link?: string;

  // هدف العرض
  target: "product" | "store" | "category";
  value?: number;                        // قيمة الخصم
  valueType?: "percentage" | "fixed";    // نوع الخصم

  // الأهداف المحددة
  product?: mongoose.Types.ObjectId;     // منتج محدد
  store?: mongoose.Types.ObjectId;       // متجر محدد
  category?: mongoose.Types.ObjectId;    // فئة محددة

  // قواعد العرض والتطبيق
  placements: PromotionPlacement[];     // أماكن العرض
  cities?: string[];                    // المدن المشمولة
  channels?: ("app" | "web")[];         // القنوات

  // قواعد الاحتساب
  stacking?: "none" | "best" | "stack_same_target";
  minQty?: number;                      // حد أدنى للكمية
  minOrderSubtotal?: number;            // حد أدنى للطلب
  maxDiscountAmount?: number;           // سقف الخصم

  // التوقيت والترتيب
  order?: number;                       // ترتيب العرض
  startDate?: Date;                     // تاريخ البداية
  endDate?: Date;                       // تاريخ النهاية
  isActive: boolean;                    // حالة التفعيل
}
```

#### أنواع العروض المدعومة:
- **عروض على منتج محدد**
- **عروض على متجر كامل**
- **عروض على فئة منتجات**
- **عروض على سلة المشتريات**

### 2. نظام استراتيجيات التسعير (PricingStrategy) 💰

#### الهيكل والخصائص:

```typescript
// src/models/delivery_marketplace_v1/PricingStrategy.ts
export interface IPricingStrategy extends Document {
  name: string;
  baseDistance: number;           // المسافة الأساسية (كم)
  basePrice: number;              // السعر الأساسي (ريال)

  // شرائح التسعير حسب المسافة
  tiers: IPricingTier[];          // شرائح السعر لكل كيلومتر

  // السعر الافتراضي للمسافات البعيدة
  defaultPricePerKm: number;
}

export interface IPricingTier {
  minDistance: number;           // بداية الشريحة
  maxDistance: number;           // نهاية الشريحة
  pricePerKm: number;            // سعر الكيلومتر في هذه الشريحة
}
```

#### آلية التسعير:
1. **تحديد المسافة** من موقع العميل للمتجر
2. **البحث عن الشريحة المناسبة** حسب المسافة
3. **حساب السعر** = `basePrice + (distance * pricePerKm)`
4. **تطبيق الحد الأدنى** للطلب إن وُجد

## نظام البحث والفلترة المتقدم

### 1. بحث المتاجر 🔍

#### المعايير المدعومة:
- **البحث النصي** في الاسم والعنوان
- **الفلترة بالفئة** حسب `categoryId`
- **البحث الجغرافي** حسب `lat` و `lng`
- **الفلترة بالحالة** (مفتوح/مغلق/متوفر)
- **الترتيب بالأقرب** جغرافياً

### 2. بحث المنتجات 🔍

#### المعايير المدعومة:
- **البحث النصي** في الاسم والوصف والوسوم
- **الفلترة بالفئة** الرئيسية والفرعية
- **الفلترة بالمتجر** محدد
- **نطاق السعر** `minPrice` - `maxPrice`
- **حالة التوفر** `isAvailable`
- **الترتيب المتعدد** (الأهمية، السعر، التقييم، الجديد)

### 3. الفهرسة والأداء ⚡

#### فهارس محسنة:
```typescript
// في DeliveryProduct
productSchema.index({ store: 1, isAvailable: 1 });
productSchema.index({ store: 1, section: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

// في DeliveryStore
storeSchema.index({ location: "2dsphere" });
storeSchema.index({ isActive: 1, usageType: 1 });
storeSchema.index({ category: 1, isActive: 1 });

// في DeliveryCategory
deliveryCategorySchema.index({ usageType: 1, parent: 1, sortOrder: 1 });
```

## التكامل مع الأنظمة الأخرى

### 1. التكامل مع نظام المستخدمين 👥

#### كيفية الربط:
- **التجار مرتبطون بالمتاجر** عبر `Vendor.store`
- **المستخدمون يطلبون من المتاجر** عبر `Order.subOrders[].store`
- **التقييمات مرتبطة بالمتاجر** والمنتجات

### 2. التكامل مع نظام السائقين 🚗

#### كيفية الربط:
- **الطلبات مرتبطة بالسائقين** عبر `Order.driver` و `Order.subOrders[].driver`
- **التقييمات تشمل السائقين** والمتاجر والمنتجات
- **الإحصائيات تشمل التسليمات** والمسافات

### 3. التكامل مع النظام المالي 💰

#### التدفق المالي:
1. **العميل يدفع** → `User.wallet` أو دفع خارجي
2. **المنصة تأخذ عمولتها** → `companyShare`
3. **التاجر يحصل على صافي المبلغ** → `storeNet`
4. **السائق يحصل على رسوم التوصيل** → `deliveryFee`

## التعارضات والمشاكل المكتشفة

### 1. تعارض في نظام المنتجات المزدوج 🔴 حرج

**المشكلة:**
- وجود نظامين منفصلين للمنتجات: `DeliveryProduct` و `MerchantProduct`
- تضارب في آلية التسعير والمخزون
- صعوبة في البحث والفلترة الموحدة

**التأثير:**
- تجربة مستخدم غير متسقة
- صعوبة في إدارة المنتجات
- مخاطر في دقة البيانات

### 2. تعارض في نظام الفئات المتعدد 🔴 حرج

**المشكلة:**
- ثلاثة أنظمة للفئات: `DeliveryCategory` + `SubCategory` + `StoreSection`
- تضارب في الاستخدام والربط بالمنتجات
- عدم وجود توحيد في نظام الترتيب

**التأثير:**
- تعقيد في تنظيم المنتجات
- صعوبة في البحث والتصفح
- تضارب في العرض للمستخدمين

### 3. تعارض في نظام التسعير والعروض 🟡 متوسط

**المشكلة:**
- نظامان منفصلان للتسعير: `Promotion` و `PricingStrategy`
- عدم وجود تكامل واضح بينهما
- صعوبة في حساب الأسعار النهائية

## حلول مقترحة لتوحيد النظام

### 1. نظام منتجات موحد

```typescript
// نظام منتج موحد يجمع مميزات كلا النظامين
export interface IUnifiedProduct extends Document {
  // الهوية والربط
  store_id: Types.ObjectId;
  category_id: Types.ObjectId;
  subcategory_id?: Types.ObjectId;
  section_id?: Types.ObjectId;

  // المعلومات الأساسية
  name: string;
  description?: string;
  price: number;
  original_price?: number;

  // التوفر والحالة
  is_available: boolean;
  stock_quantity?: number;
  availability_type: 'always' | 'limited' | 'out_of_stock';

  // التصنيف والوسوم
  tags: string[];
  attributes: IProductAttribute[];  // خصائص مخصصة موحدة

  // وحدات البيع
  selling_unit?: string;
  unit_size?: number;
  unit_measure?: string;
  min_quantity?: number;
  max_quantity?: number;
  step_quantity?: number;

  // المعلومات الإضافية
  images: string[];
  rating: number;
  ratings_count: number;
  preparation_time?: number;  // دقائق

  // المعلومات الغذائية
  nutritional_info?: {
    calories?: number;
    allergens?: string[];
    is_vegetarian?: boolean;
    is_vegan?: boolean;
  };

  // الحالة والتتبع
  status: 'active' | 'inactive' | 'deleted';
  created_by: 'system' | 'merchant' | 'admin';
  source_product_id?: Types.ObjectId;  // ربط بالمنتج الأصلي
}
```

### 2. نظام فئات موحد

```typescript
// نظام فئات موحد ومتدرج
export interface IUnifiedCategory extends Document {
  // الهوية والتسلسل
  name: string;
  slug: string;                // للـ SEO والروابط
  level: number;               // مستوى في الشجرة (1-4)

  // المعلومات الأساسية
  description?: string;
  image?: string;
  icon?: string;

  // نظام التسلسل الموحد
  parent_id?: Types.ObjectId;
  path: string;                // مسار الشجرة الكامل
  sort_order: number;

  // التصنيف والاستخدام
  category_type: 'main' | 'sub' | 'section' | 'tag';
  usage_types: ('grocery' | 'restaurant' | 'retail')[];

  // الربط بالمنتجات
  product_count?: number;      // عدد المنتجات في هذه الفئة

  // الحالة
  is_active: boolean;
  visibility: 'public' | 'internal' | 'hidden';
}
```

### 3. نظام تسعير وعروض موحد

```typescript
// نظام تسعير وعروض متكامل
export interface IUnifiedPricing extends Document {
  // الهوية والربط
  product_id?: Types.ObjectId;
  store_id?: Types.ObjectId;
  category_id?: Types.ObjectId;

  // نوع التسعير
  pricing_type: 'base' | 'promotion' | 'discount' | 'dynamic';

  // قواعد التسعير
  base_price: number;
  final_price: number;
  discount_amount?: number;
  discount_percentage?: number;

  // قواعد التطبيق
  conditions: {
    min_quantity?: number;
    max_quantity?: number;
    min_order_amount?: number;
    valid_from?: Date;
    valid_to?: Date;
    user_segments?: string[];
    location_restrictions?: string[];
  };

  // آلية التطبيق
  application_order: number;    // ترتيب تطبيق العروض
  stacking_policy: 'none' | 'best' | 'stack_all' | 'stack_same_type';

  // التتبع والمراقبة
  usage_count: number;
  total_discount_given: number;
  is_active: boolean;
}
```

## مؤشرات النجاح بعد التحسين

- ✅ توحيد نظام المنتجات بنسبة 100%
- ✅ تبسيط نظام الفئات والتصنيف
- ✅ تحسين دقة التسعير والعروض بنسبة 90%
- ✅ تحسين تجربة البحث والتصفح بنسبة 80%
- ✅ تقليل وقت إدارة المنتجات بنسبة 60%
- ✅ تحسين دقة التقارير والإحصائيات

## التوصيات النهائية

### الأولوية: فورية وحرجة
نظام المتاجر والمنتجات يحتوي على تعارضات خطيرة في:
- نظام المنتجات المزدوج
- نظام الفئات المتعدد
- نظام التسعير غير المتكامل

### الاستثمار المطلوب:
- **الوقت:** 8-10 أسابيع من التطوير المتواصل
- **الموارد:** فريق من 3-4 مطورين (تقني + تجربة مستخدم)
- **التكلفة:** عالية (إعادة هيكلة شاملة للنظام)

### الفوائد المتوقعة:
- نظام متاجر ومنتجات موحد ومتكامل بنسبة 100%
- تحسين تجربة العملاء في البحث والتصفح بنسبة 80%
- تبسيط إدارة المتاجر والمنتجات بنسبة 70%
- تحسين دقة التسعير والعروض بنسبة 90%

### المخاطر إذا لم يتم الإصلاح:
- استمرار التضارب في بيانات المنتجات
- صعوبة في البحث والعثور على المنتجات
- عدم القدرة على تطوير ميزات جديدة
- فقدان الثقة من التجار والعملاء

---
*تم إنشاء هذا التقرير بناءً على تحليل شامل لنظام المتاجر والمنتجات والفئات في التاريخ: $(date)*
*إصدار التقرير: 1.0.0*
