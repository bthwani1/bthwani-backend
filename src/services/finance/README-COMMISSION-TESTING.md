# دليل اختبار نظام العمولات والتقسيم المالي

## نظرة عامة
تم تطوير نظام متقدم لإدارة العمولات والتقسيم المالي يدعم:
- نسب منفصلة للمنصة من العناصر والتوصيل
- توزيع الإكراميات بطرق متعددة
- نظام كوبونات ممول من المنصة أو المتجر
- نظام ضرائب قابل للتخصيص
- سجل تدقيق شامل للتغييرات
- نظام versioning للعمولات

## إعداد البيئة للاختبار

### 1. إنشاء إعدادات العمولات الأولية

```javascript
// استخدم API endpoint أو الواجهة الإدارية
POST /finance/commissions/settings
{
  "rates": {
    "platformItemsCommission": 12,
    "platformDeliveryCommission": 30,
    "driverDeliveryShare": 70,
    "vendorCommission": 12,
    "tipsDistribution": "driver",
    "taxEnabled": false,
    "taxRate": 15,
    "taxBase": "total"
  },
  "effectiveFrom": "2024-01-01T00:00:00Z",
  "reason": "Initial commission setup for testing"
}
```

### 2. إنشاء كوبونات للاختبار

#### كوبون ممول من المنصة:
```javascript
POST /finance/coupons
{
  "code": "TESTPLATFORM10",
  "name": "خصم 10 ريال من المنصة",
  "type": "fixed",
  "value": 10,
  "fundedBy": "platform",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "minOrderValue": 50
}
```

#### كوبون ممول من المتجر:
```javascript
POST /finance/coupons
{
  "code": "TESTVENDOR20",
  "name": "خصم 20% من المتجر",
  "type": "percentage",
  "value": 20,
  "fundedBy": "vendor",
  "vendorId": "VENDOR_ID_HERE",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "minOrderValue": 100,
  "maxDiscount": 50
}
```

## سيناريوهات الاختبار الأساسية

### السيناريو الأول: طلب بدون كوبون وبدون ضريبة

#### بيانات الطلب:
- العناصر: 2 × 50 = 100 ريال
- رسوم التوصيل: 30 ريال
- إكرامية: 5 ريال
- كوبون: بدون
- ضريبة: معطلة

#### الحسابات المتوقعة:
```
المتجر:
- صافي العناصر لغرض العمولة = 100
- عمولة المنصة = 100 × 12% = 12.00
- حصة المتجر = 100 - 12 = 88.00

السائق:
- رسوم التوصيل = 30 × 70% = 21.00
- الإكرامية = 5.00
- إجمالي السائق = 26.00

المنصة:
- عمولة العناصر = 100 × 12% = 12.00
- عمولة التوصيل = 30 × 30% = 9.00
- صافي المنصة = 12 + 9 = 21.00
```

#### خطوات التنفيذ:
1. إنشاء طلب بالبيانات أعلاه
2. تطبيق العمولات
3. التحقق من الحسابات باستخدام:
```javascript
// فحص طلب واحد
GET /finance/commissions/calculate-preview
{
  "itemsAmount": 100,
  "deliveryFee": 30,
  "tipAmount": 5,
  "couponAmount": 0
}
```

### السيناريو الثاني: كوبون ممول من المنصة

#### بيانات الطلب:
- نفس البيانات الأساسية + كوبون 10 ريال ممول من المنصة

#### الحسابات المتوقعة:
```
المتجر:
- صافي العناصر لغرض العمولة = 100 (لا يخصم الكوبون)
- عمولة المنصة = 100 × 12% = 12.00
- حصة المتجر = 100 - 12 = 88.00

السائق:
- نفس الحسابات السابقة = 26.00

المنصة:
- عمولة العناصر = 100 × 12% = 12.00
- عمولة التوصيل = 30 × 30% = 9.00
- تكلفة الكوبون = 10.00
- صافي المنصة = 12 + 9 - 10 = 11.00
```

### السيناريو الثالث: كوبون ممول من المتجر

#### بيانات الطلب:
- نفس البيانات الأساسية + كوبون 10 ريال ممول من المتجر

#### الحسابات المتوقعة:
```
المتجر:
- صافي العناصر لغرض العمولة = 100 - 10 = 90
- عمولة المنصة = 90 × 12% = 10.80
- حصة المتجر = 90 - 10.80 = 79.20

السائق:
- نفس الحسابات السابقة = 26.00

المنصة:
- عمولة العناصر = 90 × 12% = 10.80
- عمولة التوصيل = 30 × 30% = 9.00
- صافي المنصة = 10.80 + 9 = 19.80
```

## اختبارات التحقق والمطابقة

### 1. فحص طلب واحد بالتفصيل

```javascript
import { getOrderFinancialBreakdown } from './financial-queries';

const breakdown = await getOrderFinancialBreakdown('ORDER_ID');

// التحقق من التطابق
console.log('Platform Variance:', breakdown.variance.platformVariance);
console.log('Vendor Variance:', breakdown.variance.vendorVariance);
console.log('Driver Variance:', breakdown.variance.driverVariance);

// يجب أن يكون الفرق أقل من ±0.01
assert(Math.abs(breakdown.variance.totalVariance) < 0.01);
```

### 2. فحص يومي شامل

```javascript
import { getDailyFinancialReconciliation } from './financial-queries';

const report = await getDailyFinancialReconciliation(new Date('2024-01-01'));

console.log('Daily Summary:', report.summary);
console.log('Order Value Matches:', report.reconciliation.orderValueMatchesDistribution);
console.log('Has Variance:', report.reconciliation.hasVariance);
```

### 3. فحص سلامة البيانات

```javascript
import { validateFinancialDataIntegrity } from './financial-queries';

const validation = await validateFinancialDataIntegrity('ORDER_ID');

console.log('Is Valid:', validation.isValid);
console.log('Issues Found:', validation.totalIssues);

if (validation.issues.length > 0) {
  console.log('Issues:', validation.issues);
}
```

## اختبارات السيناريوهات السلبية

### 1. تغيير النسب بعد إنشاء الطلب

```javascript
// إنشاء طلب
const order = await createOrder({
  itemsAmount: 100,
  deliveryFee: 30,
  tipAmount: 5
});

// تغيير إعدادات العمولات
await updateCommissionSettings({
  platformItemsCommission: 15, // تغيير من 12% إلى 15%
  reason: 'Testing rate change after order creation'
});

// إعادة حساب الطلب - يجب أن يحتفظ بالنسب القديمة
const breakdown = await getOrderFinancialBreakdown(order._id);
assert(breakdown.commissionSettings.platformItemsCommission === 12); // النسبة القديمة
```

### 2. كوبون يجاوز قيمة العناصر

```javascript
// طلب بقيمة 50 ريال مع كوبون 100 ريال
const result = await validateCoupon({
  code: 'TESTPLATFORM100',
  orderAmount: 50 // أقل من قيمة الكوبون
});

// يجب رفض الكوبون
assert(result.valid === false);
assert(result.reason === 'min_order_value');
```

### 3. إلغاء/استرداد طلب

```javascript
// إنشاء طلب وتطبيق العمولات
const order = await createOrder({...});
await applyCommissionToOrder(order._id, 130, driverId, vendorId, 'vendor', vendorId);

// إلغاء الطلب
await cancelOrder(order._id);

// التحقق من عكس القيود المالية
const ledgerEntries = await LedgerEntry.find({
  event_ref: order._id,
  event_type: { $in: ['order_commission', 'order_cancellation'] }
});

// يجب وجود قيود عكسية
assert(ledgerEntries.some(e => e.event_type === 'order_cancellation'));
```

## أدوات الاختبار والتحقق

### استعلامات SQL للفحص اليدوي

#### فحص طلب واحد:
```sql
SELECT
  o._id as order_id,
  o.total_amount,
  o.delivery_fee,
  o.tip_amount,
  o.coupon_code,

  -- حسابات المنصة
  (o.total_amount * cs.platform_items_commission / 100) as platform_items_fee,
  (o.delivery_fee * cs.platform_delivery_commission / 100) as platform_delivery_fee,
  CASE WHEN o.coupon_funded_by = 'platform' THEN o.coupon_amount ELSE 0 END as platform_coupon_cost,

  -- حسابات المتجر
  (o.total_amount * cs.vendor_commission / 100) as vendor_commission,
  (o.total_amount - (o.total_amount * cs.vendor_commission / 100) - o.coupon_amount) as vendor_payout,

  -- حسابات السائق
  (o.delivery_fee * cs.driver_delivery_share / 100) as driver_delivery_share,
  o.tip_amount as driver_tip,

  -- الإجماليات
  ((o.total_amount * cs.platform_items_commission / 100) +
   (o.delivery_fee * cs.platform_delivery_commission / 100) -
   CASE WHEN o.coupon_funded_by = 'platform' THEN o.coupon_amount ELSE 0 END) as platform_net,

  ((o.total_amount - (o.total_amount * cs.vendor_commission / 100) - o.coupon_amount) +
   (o.delivery_fee * cs.driver_delivery_share / 100) +
   o.tip_amount) as total_distributed

FROM orders o
CROSS JOIN commission_settings cs
WHERE o._id = 'YOUR_ORDER_ID'
AND cs.is_active = true
AND o.created_at >= cs.effective_from
AND (o.created_at <= cs.effective_to OR cs.effective_to IS NULL);
```

#### فحص يومي:
```sql
SELECT
  DATE(o.created_at) as order_date,
  COUNT(*) as total_orders,
  SUM(o.total_amount) as total_items_value,
  SUM(o.delivery_fee) as total_delivery_fees,
  SUM(o.tip_amount) as total_tips,
  SUM(o.coupon_amount) as total_coupon_amount,

  -- حسابات المنصة
  SUM(o.total_amount * cs.platform_items_commission / 100) as total_platform_items_fee,
  SUM(o.delivery_fee * cs.platform_delivery_commission / 100) as total_platform_delivery_fee,
  SUM(CASE WHEN o.coupon_funded_by = 'platform' THEN o.coupon_amount ELSE 0 END) as total_platform_coupon_cost,

  -- حسابات المتجر والسائق
  SUM(o.total_amount * cs.vendor_commission / 100) as total_vendor_commission,
  SUM(o.delivery_fee * cs.driver_delivery_share / 100) as total_driver_delivery_share,

  -- الإجماليات النهائية
  (SUM(o.total_amount * cs.platform_items_commission / 100) +
   SUM(o.delivery_fee * cs.platform_delivery_commission / 100) -
   SUM(CASE WHEN o.coupon_funded_by = 'platform' THEN o.coupon_amount ELSE 0 END)) as total_platform_net,

  (SUM(o.total_amount - (o.total_amount * cs.vendor_commission / 100) - o.coupon_amount) +
   SUM(o.delivery_fee * cs.driver_delivery_share / 100) +
   SUM(o.tip_amount)) as total_distributed

FROM orders o
CROSS JOIN commission_settings cs
WHERE DATE(o.created_at) = '2024-01-01'
AND o.status = 'delivered'
AND cs.is_active = true
GROUP BY DATE(o.created_at);
```

## خطوات الاختبار النهائية

### 1. تشغيل الاختبارات الأساسية
- [ ] اختبار طلب بدون كوبون وبدون ضريبة
- [ ] اختبار كوبون ممول من المنصة
- [ ] اختبار كوبون ممول من المتجر
- [ ] اختبار مع تفعيل الضريبة

### 2. تشغيل الاختبارات السلبية
- [ ] تغيير النسب بعد إنشاء الطلب
- [ ] كوبون يجاوز قيمة العناصر
- [ ] إلغاء طلب واسترداد المبالغ

### 3. فحص سلامة البيانات
- [ ] فحص تطابق القيم المالية
- [ ] فحص عدم وجود قيود غير متوازنة
- [ ] فحص عدم وجود أرصدة سالبة

### 4. فحص الأداء والسرعة
- [ ] قياس زمن حساب العمولات
- [ ] فحص استهلاك الذاكرة
- [ ] اختبار مع عدد كبير من الطلبات

## ملاحظات مهمة للمطورين

1. **تفريغ الكاش**: يتم تفريغ الكاش تلقائياً عند تحديث إعدادات العمولات
2. **نظام التدقيق**: يتم تسجيل جميع التغييرات في سجل التدقيق
3. **نظام النسخ**: يتم حفظ نسخة من الإعدادات السابقة عند التعديل
4. **التحقق من الصحة**: استخدم دائماً `validateFinancialDataIntegrity()` قبل الاعتماد على البيانات

## استكشاف الأخطاء

### مشاكل شائعة وحلولها:

1. **فرق في الحسابات**: تحقق من دقة الأرقام العشرية والتقريب
2. **قيود غير متوازنة**: فحص نظام القيود المالية والـ ledger entries
3. **كوبونات غير صالحة**: تحقق من تواريخ الكوبونات وحدها الاستخدام
4. **تغييرات لا تنعكس**: تحقق من تفريغ الكاش وإعادة تحميل الصفحة

## الخلاصة

هذا النظام يوفر إدارة شاملة ومرونة كاملة للعمولات والتقسيم المالي مع ضمان دقة الحسابات وسلامة البيانات. اتبع السيناريوهات المحددة لضمان عمل النظام بشكل صحيح في جميع الحالات.
