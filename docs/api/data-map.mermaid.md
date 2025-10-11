# 🗺️ مخطط علاقات البيانات (Data Relationship Map)

## نظرة عامة على العلاقات الرئيسية

```mermaid
erDiagram

    %% المستخدمين والمصادقة
    User ||--o{ Order : "يطلب"
    User ||--o{ Wallet : "يمتلك"
    User ||--o{ Address : "يحفظ"
    User ||--o{ Favorite : "يحفظ"
    User ||--o{ Notification : "يتلقى"
    User ||--o{ Transaction : "يقوم بـ"
    User ||--o{ Review : "يكتب"

    %% الطلبات والتوصيل
    Order }o--|| User : "للمستخدم"
    Order }o--o{ OrderItem : "يتكون من"
    Order }o--|| Driver : "يسنده"
    Order }o--|| DeliveryStore : "من متجر"
    Order ||--o{ OrderStatus : "يمر بـ"
    Order ||--o{ Note : "يحتوي على"

    %% المتاجر والمنتجات
    DeliveryStore ||--o{ OrderItem : "يوفر"
    DeliveryStore ||--o{ DeliveryProduct : "يبيع"
    DeliveryStore ||--o{ MerchantProduct : "يبيع"
    DeliveryStore }o--|| Category : "ينتمي لـ"
    DeliveryStore ||--o{ StoreSection : "يحتوي على"
    DeliveryStore ||--o{ Review : "يتلقى"

    %% السائقين
    Driver ||--o{ Order : "يوصل"
    Driver ||--o{ DriverLocation : "يحدث موقعه"
    Driver ||--o{ DriverShift : "يعمل في"
    Driver ||--o{ DriverReview : "يتلقى تقييم"
    Driver ||--o{ DriverAsset : "يستخدم"
    Driver ||--o{ VacationRequest : "يطلب"

    %% المحفظة والمعاملات المالية
    Wallet ||--o{ Transaction : "تسجل معاملاتها"
    Wallet ||--o{ TopupLog : "تسجل عمليات الشحن"
    Wallet ||--o{ WithdrawalRequest : "تطلب سحب"

    %% المحاسبة والقيود
    ChartAccount ||--o{ JournalEntry : "يشارك في"
    ChartAccount ||--o{ LedgerEntry : "يحتوي على"
    JournalEntry ||--o{ JournalEntryLine : "يتكون من"
    JournalEntry ||--|| Voucher : "مرتبط بـ"

    %% الإدارة والمراقبة
    AdminUser ||--o{ AdminLog : "يقوم بـ"
    AdminUser ||--o{ Notification : "يرسل"
    AdminUser ||--o{ Setting : "يحدد"
    AdminUser ||--o{ CommissionPlan : "يحدد"

    %% التجار والموردين
    Vendor ||--o{ VendorProduct : "يبيع"
    Vendor ||--o{ VendorOrder : "يتلقى"
    Vendor ||--o{ VendorSettlement : "يحصل على"
    Vendor ||--o{ VendorReview : "يتلقى تقييم"

    %% التسويق والمندوبين
    Marketer ||--o{ MarketingCampaign : "يدير"
    Marketer ||--o{ CommissionRule : "يستفيد من"
    Marketer ||--o{ ReferralEvent : "يحصل على"
    Marketer ||--o{ CommissionPlan : "مرتبط بـ"

    %% العلاقات التفصيلية
    OrderItem }o--|| DeliveryProduct : "مرتبط بـ"
    OrderItem }o--|| MerchantProduct : "مرتبط بـ"

    DeliveryProduct }o--|| Category : "ينتمي لـ"
    DeliveryProduct }o--|| Promotion : "يخضع لـ"

    MerchantProduct }o--|| Category : "ينتمي لـ"
    MerchantProduct }o--|| Promotion : "يخضع لـ"

    %% علاقات الموقع الجغرافي
    User }o--|| Address : "يحدد"
    DeliveryStore }o--|| Location : "يقع في"
    Driver }o--|| DriverLocation : "يحدد موقعه"

    %% علاقات المراجعة والتقييم
    Review }o--|| User : "يكتبها"
    Review }o--|| DeliveryStore : "عن متجر"
    Review }o--|| Driver : "عن سائق"
    Review }o--|| Vendor : "عن تاجر"

    %% علاقات المخزون والمبيعات
    Inventory }o--|| DeliveryProduct : "يتبع"
    Inventory }o--|| MerchantProduct : "يتبع"
    Inventory }o--|| DeliveryStore : "في متجر"

    %% علاقات التقارير والتحليلات
    Analytics }o--|| Order : "يحلل"
    Analytics }o--|| User : "يحلل سلوك"
    Analytics }o--|| DeliveryStore : "يحلل أداء"
    Analytics }o--|| Driver : "يحلل أداء"
```

## تفاصيل العلاقات الرئيسية

### 1. نظام المستخدمين (Users)
```mermaid
graph TD
    A[User] --> B[Profile]
    A --> C[Wallet]
    A --> D[Address]
    A --> E[Orders]
    A --> F[Reviews]
    A --> G[Notifications]
    A --> H[Favorites]

    C --> I[Transactions]
    C --> J[Topup Logs]
    C --> K[Withdrawals]

    E --> L[Order Items]
    E --> M[Order Status]
    E --> N[Delivery Tracking]
```

### 2. نظام الطلبات (Orders)
```mermaid
graph TD
    A[Order] --> B[Customer]
    A --> C[Store]
    A --> D[Driver]
    A --> E[Items]
    A --> F[Payment]
    A --> G[Status History]
    A --> H[Notes]

    E --> I[Products]
    E --> J[Quantities]
    E --> K[Prices]

    F --> L[Wallet]
    F --> M[Cash]
    F --> N[Card]

    G --> O[Status Changes]
    G --> P[Timestamps]
    G --> Q[Actors]
```

### 3. نظام المتاجر (Stores)
```mermaid
graph TD
    A[Store] --> B[Basic Info]
    A --> C[Location]
    A --> D[Products]
    A --> E[Orders]
    A --> F[Reviews]
    A --> G[Settings]

    B --> H[Name]
    B --> I[Description]
    B --> J[Category]

    C --> K[Coordinates]
    C --> L[Address]
    C --> M[Coverage Area]

    D --> N[Delivery Products]
    D --> O[Merchant Products]
    D --> P[Categories]

    G --> Q[Hours]
    G --> R[Commission]
    G --> S[Delivery Settings]
```

### 4. نظام السائقين (Drivers)
```mermaid
graph TD
    A[Driver] --> B[Profile]
    A --> C[Vehicle]
    A --> D[Location]
    A --> E[Orders]
    A --> F[Performance]
    A --> G[Wallet]

    B --> H[Personal Info]
    B --> I[License]
    B --> J[Verification]

    C --> K[Type]
    C --> L[Capacity]
    C --> M[Features]

    D --> N[Current Location]
    D --> O[Home Base]
    D --> P[Coverage Area]

    F --> Q[Stats]
    F --> R[Ratings]
    F --> S[Earnings]
```

### 5. نظام المحاسبة (Accounting)
```mermaid
graph TD
    A[Chart of Accounts] --> B[Assets]
    A --> C[Liabilities]
    A --> D[Equity]
    A --> E[Revenue]
    A --> F[Expenses]

    G[Journal Entries] --> H[Debit]
    G --> I[Credit]
    G --> J[Reference]
    G --> K[Date]

    L[Ledger] --> M[Account Balance]
    L --> N[Transactions]
    L --> O[Running Total]

    P[Financial Reports] --> Q[P&L]
    P --> R[Balance Sheet]
    P --> S[Cash Flow]
```

## جداول البيانات الرئيسية

### جدول المستخدمين والمصادقة
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|---------------------|
| `User` | بيانات المستخدمين الأساسية | Orders, Wallet, Addresses, Reviews |
| `Address` | عناوين المستخدمين | مرتبطة بالمستخدمين والطلبات |
| `Wallet` | محافظ المستخدمين المالية | Transactions, Topups, Withdrawals |
| `Favorite` | المنتجات المفضلة | مرتبطة بالمستخدمين والمنتجات |

### جدول الطلبات والتوصيل
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|---------------------|
| `Order` | الطلبات الرئيسية | Users, Stores, Drivers, Items |
| `OrderItem` | عناصر الطلبات | مرتبطة بالطلبات والمنتجات |
| `OrderStatus` | سجل حالات الطلبات | مرتبطة بالطلبات |
| `DeliveryTracking` | تتبع التوصيل | مرتبطة بالطلبات والسائقين |

### جدول المتاجر والمنتجات
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|---------------------|
| `DeliveryStore` | المتاجر والمطاعم | Products, Orders, Categories |
| `DeliveryProduct` | منتجات التوصيل | مرتبطة بالمتاجر والطلبات |
| `MerchantProduct` | منتجات التجار | مرتبطة بالمتاجر والطلبات |
| `Category` | فئات المنتجات | مرتبطة بالمتاجر والمنتجات |

### جدول السائقين والمركبات
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|---------------------|
| `Driver` | بيانات السائقين | Orders, Vehicles, Locations |
| `DriverLocation` | مواقع السائقين | مرتبطة بالسائقين |
| `DriverShift` | ورديات السائقين | مرتبطة بالسائقين |
| `Vehicle` | مركبات السائقين | مرتبطة بالسائقين |

### جدول المحاسبة والمالية
| الجدول | الغرض | العلاقات الرئيسية |
|---------|--------|---------------------|
| `ChartAccount` | دليل الحسابات | Journal Entries, Ledgers |
| `JournalEntry` | قيود اليومية | مرتبطة بالحسابات |
| `LedgerEntry` | سجلات الأستاذ | مرتبطة بالحسابات |
| `Transaction` | المعاملات المالية | مرتبطة بالمحافظ |

## مخطط قاعدة البيانات المفصل

```mermaid
graph TB
    %% Core Entities
    User[User<br/>المستخدمين]
    Order[Order<br/>الطلبات]
    Store[Store<br/>المتاجر]
    Driver[Driver<br/>السائقين]
    Product[Product<br/>المنتجات]

    %% Financial Entities
    Wallet[Wallet<br/>المحافظ]
    Transaction[Transaction<br/>المعاملات]
    ChartAccount[ChartAccount<br/>دليل الحسابات]
    JournalEntry[JournalEntry<br/>قيود اليومية]

    %% Supporting Entities
    Address[Address<br/>العناوين]
    Review[Review<br/>التقييمات]
    Category[Category<br/>الفئات]
    Notification[Notification<br/>الإشعارات]

    %% Relationships
    User -->|1:N| Order
    User -->|1:1| Wallet
    User -->|1:N| Address
    User -->|1:N| Review

    Order -->|N:M| Product
    Order -->|N:1| Driver
    Order -->|N:1| Store

    Store -->|1:N| Product
    Store -->|1:N| Order
    Store -->|N:1| Category

    Product -->|N:1| Category
    Product -->|N:1| Store

    Driver -->|1:N| Order
    Driver -->|1:N| Review

    Wallet -->|1:N| Transaction

    Transaction -->|N:1| ChartAccount
    JournalEntry -->|N:1| ChartAccount

    %% Cross Relations
    Review -->|N:1| User
    Review -->|N:1| Store
    Review -->|N:1| Driver

    Address -->|N:1| User
    Address -->|N:1| Order

    Notification -->|N:1| User
```

## العلاقات الجغرافية والمكانية

```mermaid
graph LR
    A[Geographic Zones] --> B[Store Coverage]
    A --> C[Driver Areas]
    A --> D[Delivery Zones]

    B --> E[Store Location]
    C --> F[Driver Base]
    D --> G[Order Destination]

    E --> H[GPS Coordinates]
    F --> I[Home Location]
    G --> J[Delivery Address]

    H --> K[Lat/Lng]
    I --> L[Lat/Lng]
    J --> M[Lat/Lng]

    K --> N[Distance Calculation]
    L --> O[Route Planning]
    M --> P[ETA Calculation]
```

## تدفق البيانات في النظام

```mermaid
flowchart TD
    %% Customer Journey
    A[Customer Places Order] --> B[Order Validation]
    B --> C[Payment Processing]
    C --> D[Store Notification]
    D --> E[Driver Assignment]
    E --> F[Order Preparation]
    F --> G[Pickup & Delivery]
    G --> H[Order Completion]
    H --> I[Payment Settlement]
    I --> J[Review & Rating]

    %% Financial Flow
    K[Transaction Recording] --> L[Wallet Updates]
    L --> M[Commission Calculation]
    M --> N[Settlement Processing]
    N --> O[Financial Reporting]

    %% Admin Monitoring
    P[Real-time Tracking] --> Q[Performance Metrics]
    Q --> R[Analytics Dashboard]
    R --> S[System Optimization]

    %% Data Flow
    T[API Endpoints] --> U[Business Logic]
    U --> V[Database Operations]
    V --> W[External Services]
    W --> X[Response Generation]
```

## ملاحظات مهمة حول العلاقات

### 🔗 علاقات رئيسية حرجة
1. **User ↔ Order**: علاقة واحد لمتعدد - مستخدم واحد يمكنه إنشاء عدة طلبات
2. **Order ↔ Store**: علاقة متعدد لواحد - طلب واحد مرتبط بمتجر واحد فقط
3. **Store ↔ Product**: علاقة واحد لمتعدد - متجر واحد يحتوي على عدة منتجات
4. **Driver ↔ Order**: علاقة متعدد لواحد - سائق واحد يتعامل مع عدة طلبات

### 💰 علاقات مالية مهمة
1. **Wallet ↔ Transaction**: سجل كامل لجميع المعاملات المالية
2. **ChartAccount ↔ JournalEntry**: ربط القيود بالحسابات المحاسبية
3. **Order ↔ Payment**: تتبع طرق الدفع والمبالغ

### 📍 علاقات جغرافية
1. **Location-based Queries**: استخدام فهارس 2dsphere للبحث بالقرب
2. **Driver Tracking**: تتبع موقع السائق في الوقت الفعلي
3. **Store Coverage**: تحديد مناطق تغطية المتاجر

### 🔄 علاقات الوقت والتتبع
1. **Status History**: سجل زمني لتغييرات حالة الطلبات
2. **Timestamps**: تتبع أوقات الإنشاء والتحديث
3. **Audit Trail**: سجل للعمليات الإدارية

## نصائح للمطورين

### فهارس مهمة للأداء
```javascript
// فهارس الأداء الرئيسية
UserSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
StoreSchema.index({ location: "2dsphere" });
DriverSchema.index({ location: "2dsphere" });
ProductSchema.index({ category: 1, store: 1 });
```

### استعلامات معقدة مدعومة
- **البحث بالقرب الجغرافي** (Near queries)
- **البحث النصي الكامل** (Text search)
- **التصفح مع الفلترة** (Pagination with filters)
- **التجميع والتقارير** (Aggregation pipelines)

### اعتبارات الأمان
- تشفير البيانات الحساسة (كلمات المرور، معلومات البطاقات)
- تقييد الوصول حسب الأدوار (RBAC)
- تسجيل العمليات الحساسة (Audit logging)
- حماية من هجمات الحقن (Input sanitization)

---

*هذا المخطط يوضح العلاقات المعقدة والمترابطة في نظام Bthwani ويساعد المطورين على فهم تدفق البيانات والعلاقات بين الكيانات المختلفة.*
