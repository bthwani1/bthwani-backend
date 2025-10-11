/**
 * هيكل المشروع المالي - تنظيم حسب Domains وServices
 * يوضح كيفية تنظيم الكود حسب المسؤوليات والوحدات
 */

// =====================================================
// هيكل المشروع المقترح حسب Domains
// =====================================================

export const PROJECT_STRUCTURE = {
  // Domain Layer - يحتوي على منطق الأعمال والقواعد
  domain: {
    finance: {
      description: 'مجال المالية يحتوي على كل منطق الأعمال المالي',
      subdomains: {
        settlements: 'إدارة التسويات والمدفوعات المؤجلة',
        payouts: 'إدارة دفعات السائقين والتجار',
        wallets: 'إدارة المحافظ والأرصدة',
        commissions: 'إدارة قواعد العمولات وحسابها',
        ledger: 'إدارة قيود دفتر الأستاذ المزدوج',
        reconciliation: 'إدارة المطابقة والتقارير المالية'
      },

      modules: {
        // Core Business Logic
        'settlement.domain.ts': 'قواعد أعمال التسويات',
        'payout.domain.ts': 'قواعد أعمال الدفعات',
        'wallet.domain.ts': 'قواعد أعمال المحافظ',
        'commission.domain.ts': 'قواعد أعمال العمولات',
        'ledger.domain.ts': 'قواعد أعمال قيود دفتر الأستاذ',
        'reconciliation.domain.ts': 'قواعد أعمال المطابقة',

        // Domain Events
        'events/': {
          'settlement-created.event.ts': 'حدث إنشاء تسوية',
          'settlement-paid.event.ts': 'حدث دفع تسوية',
          'payout-processed.event.ts': 'حدث معالجة دفعة',
          'ledger-entry-created.event.ts': 'حدث إنشاء قيد محاسبي'
        },

        // Domain Services
        'services/': {
          'settlement-calculator.service.ts': 'خدمة حساب التسويات',
          'payout-processor.service.ts': 'خدمة معالجة الدفعات',
          'wallet-balance-calculator.service.ts': 'خدمة حساب أرصدة المحافظ',
          'commission-engine.service.ts': 'محرك حساب العمولات',
          'ledger-validator.service.ts': 'خدمة التحقق من قيود دفتر الأستاذ'
        }
      }
    }
  },

  // Application Layer - يحتوي على حالات الاستخدام والتطبيقات
  application: {
    finance: {
      description: 'طبقة التطبيق تحتوي على حالات الاستخدام والـ use cases',

      useCases: {
        'settlement/': {
          'create-settlement.usecase.ts': 'حالة استخدام إنشاء تسوية',
          'mark-settlement-paid.usecase.ts': 'حالة استخدام تعليم التسوية كمدفوعة',
          'export-settlement.usecase.ts': 'حالة استخدام تصدير التسوية'
        },

        'payout/': {
          'create-payout-batch.usecase.ts': 'حالة استخدام إنشاء دفعة سائقين',
          'process-payout-batch.usecase.ts': 'حالة استخدام معالجة دفعة',
          'export-payout-batch.usecase.ts': 'حالة استخدام تصدير دفعة'
        },

        'wallet/': {
          'view-wallet-statement.usecase.ts': 'حالة استخدام عرض كشف محفظة',
          'export-wallet-statement.usecase.ts': 'حالة استخدام تصدير كشف محفظة'
        },

        'commission/': {
          'manage-commission-rules.usecase.ts': 'حالة استخدام إدارة قواعد العمولة',
          'calculate-commission.usecase.ts': 'حالة استخدام حساب العمولة'
        },

        'reconciliation/': {
          'generate-daily-report.usecase.ts': 'حالة استخدام توليد تقرير يومي',
          'validate-ledger-balance.usecase.ts': 'حالة استخدام التحقق من توازن القيود'
        }
      }
    }
  },

  // Infrastructure Layer - يحتوي على التفاصيل التقنية
  infrastructure: {
    finance: {
      description: 'طبقة البنية التحتية تحتوي على التفاصيل التقنية',

      repositories: {
        'settlement/': {
          'settlement.repository.ts': 'مستودع التسويات',
          'settlement-line.repository.ts': 'مستودع بنود التسويات'
        },

        'payout/': {
          'payout-batch.repository.ts': 'مستودع دفعات السائقين',
          'payout-item.repository.ts': 'مستودع عناصر الدفعات'
        },

        'wallet/': {
          'wallet-account.repository.ts': 'مستودع حسابات المحافظ',
          'ledger-entry.repository.ts': 'مستودع قيود دفتر الأستاذ',
          'ledger-split.repository.ts': 'مستودع تفاصيل القيود',
          'wallet-statement.repository.ts': 'مستودع كشوف المحافظ'
        },

        'commission/': {
          'commission-rule.repository.ts': 'مستودع قواعد العمولات'
        }
      },

      externalServices: {
        'bank-integration/': {
          'bank-api.service.ts': 'خدمة تكامل مع البنوك',
          'psp-integration.service.ts': 'خدمة تكامل مع مزودي الدفع'
        },

        'notification/': {
          'email-notification.service.ts': 'خدمة إشعارات البريد الإلكتروني',
          'sms-notification.service.ts': 'خدمة إشعارات الرسائل النصية',
          'slack-notification.service.ts': 'خدمة إشعارات Slack'
        }
      },

      configuration: {
        'finance.config.ts': 'إعدادات النظام المالي',
        'currency.config.ts': 'إعدادات العملات',
        'rounding.config.ts': 'إعدادات التقريب المالي'
      }
    }
  },

  // Interface Layer - يحتوي على Controllers وRoutes وMiddleware
  interface: {
    finance: {
      description: 'طبقة الواجهات تحتوي على Controllers وRoutes',

      controllers: {
        'settlement.controller.ts': 'كونترولر التسويات',
        'payout.controller.ts': 'كونترولر الدفعات',
        'wallet.controller.ts': 'كونترولر المحافظ',
        'commission.controller.ts': 'كونترولر العمولات',
        'reconciliation.controller.ts': 'كونترولر المطابقة',
        'monitoring.controller.ts': 'كونترولر المراقبة'
      },

      middleware: {
        'finance.middleware.ts': 'حماية الأذونات المالية',
        'audit.middleware.ts': 'تسجيل العمليات المالية',
        'validation.middleware.ts': 'التحقق من صحة البيانات'
      },

      routes: {
        'settlement.routes.ts': 'روتس التسويات',
        'payout.routes.ts': 'روتس الدفعات',
        'wallet.routes.ts': 'روتس المحافظ',
        'commission.routes.ts': 'روتس العمولات',
        'reconciliation.routes.ts': 'روتس المطابقة',
        'monitoring.routes.ts': 'روتس المراقبة'
      },

      dtos: {
        'request/': {
          'create-settlement.dto.ts': 'DTO لطلب إنشاء تسوية',
          'create-payout.dto.ts': 'DTO لطلب إنشاء دفعة',
          'update-settlement.dto.ts': 'DTO لتحديث التسوية'
        },

        'response/': {
          'settlement.dto.ts': 'DTO لاستجابة التسوية',
          'payout.dto.ts': 'DTO لاستجابة الدفعة',
          'wallet-balance.dto.ts': 'DTO لرصيد المحفظة'
        }
      }
    }
  },

  // Shared Kernel - يحتوي على المشتركات والأدوات
  shared: {
    finance: {
      description: 'النواة المشتركة تحتوي على الأدوات والمشتركات',

      types: {
        'finance.types.ts': 'أنواع البيانات المالية',
        'enums.ts': 'تعدادات النظام المالي',
        'interfaces.ts': 'واجهات النظام المالي'
      },

      utilities: {
        'currency.util.ts': 'أدوات العملات والتحويل',
        'rounding.util.ts': 'أدوات التقريب المالي',
        'date.util.ts': 'أدوات التواريخ المالية',
        'validation.util.ts': 'أدوات التحقق من صحة البيانات'
      },

      constants: {
        'finance.constants.ts': 'ثوابت النظام المالي',
        'error-codes.ts': 'أكواد الأخطاء المالية'
      },

      exceptions: {
        'finance.exception.ts': 'استثناءات النظام المالي',
        'validation.exception.ts': 'استثناءات التحقق من الصحة'
      }
    }
  }
};

// =====================================================
// هيكل المهام المجدولة (Cron Jobs)
// =====================================================

export const SCHEDULED_TASKS = {
  finance: {
    // مهام يومية
    daily: {
      '00:30': {
        name: 'generate-daily-settlements',
        description: 'توليد التسويات اليومية للسائقين والتجار',
        script: 'cron/settlement-generator.js',
        enabled: true
      },

      '01:00': {
        name: 'daily-finance-check',
        description: 'فحص يومي للنظام المالي والتنبيهات',
        script: 'cron/finance-health-check.js',
        enabled: true
      },

      '02:00': {
        name: 'generate-daily-reports',
        description: 'توليد التقارير اليومية للمطابقة',
        script: 'cron/daily-reconciliation.js',
        enabled: true
      }
    },

    // مهام أسبوعية
    weekly: {
      'monday-03:00': {
        name: 'weekly-payout-processing',
        description: 'معالجة دفعات السائقين الأسبوعية',
        script: 'cron/weekly-payouts.js',
        enabled: true
      },

      'sunday-23:00': {
        name: 'weekly-reconciliation',
        description: 'مطابقة أسبوعية شاملة',
        script: 'cron/weekly-reconciliation.js',
        enabled: true
      }
    },

    // مهام شهرية
    monthly: {
      '01-04:00': {
        name: 'monthly-commission-report',
        description: 'تقرير العمولات الشهري',
        script: 'cron/monthly-commission-report.js',
        enabled: true
      },

      '01-05:00': {
        name: 'monthly-settlement-summary',
        description: 'ملخص التسويات الشهري',
        script: 'cron/monthly-settlement-summary.js',
        enabled: true
      }
    }
  }
};

// =====================================================
// هيكل قاعدة البيانات
// =====================================================

export const DATABASE_STRUCTURE = {
  collections: {
    // Core Finance Collections
    settlements: {
      description: 'جدول التسويات الرئيسي',
      indexes: [
        '{ type: 1, status: 1, period_start: 1, period_end: 1 }',
        '{ payable_account_id: 1 }',
        '{ createdAt: -1 }'
      ]
    },

    settlement_lines: {
      description: 'بنود التسويات المفصلة',
      indexes: [
        '{ settlement_id: 1, ref_id: 1 }',
        '{ ref_type: 1, ref_id: 1 }'
      ]
    },

    payout_batches: {
      description: 'دفعات السائقين الرئيسية',
      indexes: [
        '{ status: 1, period_start: 1, period_end: 1 }',
        '{ createdAt: 1 }'
      ]
    },

    payout_items: {
      description: 'عناصر دفعات السائقين',
      indexes: [
        '{ batch_id: 1, account_id: 1 }',
        '{ status: 1 }'
      ]
    },

    wallet_accounts: {
      description: 'حسابات المحافظ',
      indexes: [
        '{ owner_type: 1, owner_id: 1 }', // unique
        '{ status: 1 }'
      ]
    },

    ledger_entries: {
      description: 'قيود دفتر الأستاذ الرئيسية',
      indexes: [
        '{ event_type: 1, event_ref: 1 }',
        '{ createdAt: 1 }',
        '{ is_balanced: 1 }'
      ]
    },

    ledger_splits: {
      description: 'تفاصيل قيود دفتر الأستاذ',
      indexes: [
        '{ entry_id: 1 }',
        '{ account_id: 1, balance_state: 1 }',
        '{ account_type: 1, balance_state: 1 }'
      ]
    },

    commission_rules: {
      description: 'قواعد العمولات',
      indexes: [
        '{ applicable_to: 1, is_active: 1, effective_from: 1, effective_to: 1 }',
        '{ priority: -1 }'
      ]
    },

    wallet_statement_lines: {
      description: 'كشوف حسابات المحافظ',
      indexes: [
        '{ account_id: 1, date: -1 }',
        '{ date: 1, account_id: 1 }',
        '{ account_id: 1, balance_state: 1, date: -1 }'
      ]
    },

    // Audit and Monitoring Collections
    finance_audit_logs: {
      description: 'سجلات التدقيق المالي',
      indexes: [
        '{ entity_type: 1, entity_id: 1 }',
        '{ user_id: 1 }',
        '{ action: 1, createdAt: -1 }'
      ]
    },

    finance_metrics: {
      description: 'مقاييس النظام المالي',
      indexes: [
        '{ date: 1 }',
        '{ type: 1, date: 1 }'
      ]
    },

    finance_alerts: {
      description: 'تنبيهات النظام المالي',
      indexes: [
        '{ type: 1, severity: 1 }',
        '{ created_at: -1 }',
        '{ resolved_at: 1 }'
      ]
    }
  },

  views: {
    wallet_balances: {
      description: 'عرض أرصدة المحافظ المحسوبة',
      query: `
        SELECT
          wa._id as account_id,
          wa.owner_type,
          wa.owner_id,
          wa.currency,
          SUM(CASE WHEN ls.balance_state = 'pending' AND ls.side = 'credit' THEN ls.amount ELSE 0 END) -
          SUM(CASE WHEN ls.balance_state = 'pending' AND ls.side = 'debit' THEN ls.amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN ls.balance_state = 'available' AND ls.side = 'credit' THEN ls.amount ELSE 0 END) -
          SUM(CASE WHEN ls.balance_state = 'available' AND ls.side = 'debit' THEN ls.amount ELSE 0 END) as available_amount,
          (pending_amount + available_amount) as total_amount
        FROM wallet_accounts wa
        LEFT JOIN ledger_splits ls ON wa._id = ls.account_id
        WHERE wa.status = 'active'
        GROUP BY wa._id, wa.owner_type, wa.owner_id, wa.currency
      `
    },

    daily_order_summary: {
      description: 'ملخص الطلبات اليومي',
      query: `
        SELECT
          DATE(delivered_at) as date,
          COUNT(*) as order_count,
          SUM(price) as total_subtotal,
          SUM(delivery_fee) as total_delivery_fee,
          SUM(company_share) as total_company_share,
          SUM(platform_share) as total_platform_share,
          SUM(price + delivery_fee) as total_gross
        FROM orders
        WHERE status = 'delivered' AND delivered_at IS NOT NULL
        GROUP BY DATE(delivered_at)
        ORDER BY date DESC
      `
    },

    monthly_settlement_summary: {
      description: 'ملخص التسويات الشهري',
      query: `
        SELECT
          s.type,
          DATE_FORMAT(s.period_start, '%Y-%m') as month,
          COUNT(*) as settlement_count,
          SUM(s.net_amount) as total_amount,
          AVG(s.net_amount) as avg_amount,
          MIN(s.net_amount) as min_amount,
          MAX(s.net_amount) as max_amount
        FROM settlements s
        WHERE s.status = 'paid'
        GROUP BY s.type, DATE_FORMAT(s.period_start, '%Y-%m')
        ORDER BY month DESC, s.type
      `
    }
  }
};

// =====================================================
// هيكل اختبارات النظام
// =====================================================

export const TESTING_STRUCTURE = {
  unit: {
    domain: [
      'settlement.domain.test.ts',
      'payout.domain.test.ts',
      'wallet.domain.test.ts',
      'commission.domain.test.ts',
      'ledger.domain.test.ts'
    ],

    services: [
      'settlement-calculator.service.test.ts',
      'payout-processor.service.test.ts',
      'wallet-balance-calculator.service.test.ts',
      'commission-engine.service.test.ts'
    ],

    repositories: [
      'settlement.repository.test.ts',
      'wallet-account.repository.test.ts',
      'ledger-entry.repository.test.ts'
    ]
  },

  integration: {
    'settlement-workflow.test.ts': 'اختبار سير عمل التسويات الكامل',
    'payout-workflow.test.ts': 'اختبار سير عمل الدفعات الكامل',
    'wallet-operations.test.ts': 'اختبار عمليات المحفظة الكاملة',
    'ledger-balance.test.ts': 'اختبار توازن قيود دفتر الأستاذ'
  },

  e2e: {
    'settlement-end-to-end.test.ts': 'اختبار شامل لعملية التسوية',
    'payout-end-to-end.test.ts': 'اختبار شامل لعملية الدفع',
    'wallet-statement-end-to-end.test.ts': 'اختبار شامل لكشف المحفظة',
    'reconciliation-end-to-end.test.ts': 'اختبار شامل للمطابقة'
  },

  performance: {
    'settlement-generation.perf.test.ts': 'اختبار أداء توليد التسويات',
    'payout-processing.perf.test.ts': 'اختبار أداء معالجة الدفعات',
    'wallet-balance-calculation.perf.test.ts': 'اختبار أداء حساب الأرصدة',
    'csv-export.perf.test.ts': 'اختبار أداء تصدير CSV'
  }
};

// =====================================================
// هيكل التوثيق
// =====================================================

export const DOCUMENTATION_STRUCTURE = {
  'README.md': 'دليل المطور الرئيسي للنظام المالي',

  api: {
    'settlements-api.md': 'توثيق API التسويات',
    'payouts-api.md': 'توثيق API الدفعات',
    'wallet-api.md': 'توثيق API المحافظ',
    'commission-api.md': 'توثيق API العمولات',
    'reconciliation-api.md': 'توثيق API المطابقة'
  },

  guides: {
    'settlement-guide.md': 'دليل إنشاء وإدارة التسويات',
    'payout-guide.md': 'دليل إنشاء ومعالجة الدفعات',
    'wallet-guide.md': 'دليل إدارة المحافظ والأرصدة',
    'commission-guide.md': 'دليل إدارة قواعد العمولات',
    'reconciliation-guide.md': 'دليل المطابقة والتقارير'
  },

  specifications: {
    'csv-formats.md': 'مواصفات ملفات CSV المستخدمة',
    'data-models.md': 'نماذج البيانات والعلاقات',
    'business-rules.md': 'قواعد الأعمال والمنطق',
    'security-permissions.md': 'الأذونات والحماية'
  },

  examples: {
    'query-examples.md': 'عينات استعلامات وعمليات جاهزة',
    'integration-examples.md': 'أمثلة التكامل مع التطبيقات',
    'testing-examples.md': 'أمثلة اختبارات النظام'
  },

  deployment: {
    'deployment-guide.md': 'دليل النشر والتشغيل',
    'monitoring-guide.md': 'دليل المراقبة والتنبيهات',
    'troubleshooting.md': 'دليل حل المشاكل الشائعة'
  }
};

// مثال على كيفية تنظيم الكود في المشروع

export const codeOrganizationExample = `
Backend/
├── src/
│   ├── domain/
│   │   └── finance/
│   │       ├── settlement.domain.ts
│   │       ├── payout.domain.ts
│   │       ├── wallet.domain.ts
│   │       ├── commission.domain.ts
│   │       ├── ledger.domain.ts
│   │       └── events/
│   │           ├── settlement-created.event.ts
│   │           └── payout-processed.event.ts
│   │
│   ├── application/
│   │   └── finance/
│   │       └── useCases/
│   │           ├── settlement/
│   │           │   ├── create-settlement.usecase.ts
│   │           │   └── mark-settlement-paid.usecase.ts
│   │           └── payout/
│   │               ├── create-payout-batch.usecase.ts
│   │               └── process-payout-batch.usecase.ts
│   │
│   ├── infrastructure/
│   │   └── finance/
│   │       ├── repositories/
│   │       │   ├── settlement.repository.ts
│   │       │   ├── payout-batch.repository.ts
│   │       │   └── wallet-account.repository.ts
│   │       ├── externalServices/
│   │       │   ├── bank-integration.service.ts
│   │       │   └── notification.service.ts
│   │       └── configuration/
│   │           ├── finance.config.ts
│   │           └── currency.config.ts
│   │
│   ├── interface/
│   │   └── finance/
│   │       ├── controllers/
│   │       │   ├── settlement.controller.ts
│   │       │   ├── payout.controller.ts
│   │       │   └── wallet.controller.ts
│   │       ├── middleware/
│   │       │   ├── finance.middleware.ts
│   │       │   └── audit.middleware.ts
│   │       ├── routes/
│   │       │   ├── settlement.routes.ts
│   │       │   ├── payout.routes.ts
│   │       │   └── wallet.routes.ts
│   │       └── dtos/
│   │           ├── request/
│   │           └── response/
│   │
│   └── shared/
│       └── finance/
│           ├── types/
│           │   ├── finance.types.ts
│           │   └── enums.ts
│           ├── utilities/
│           │   ├── currency.util.ts
│           │   └── validation.util.ts
│           └── constants/
│               └── finance.constants.ts
`;

// مثال على كيفية استخدام الهيكل في التطوير

export const developmentWorkflow = {
  // 1. إضافة ميزة جديدة
  addNewFeature: [
    '1. تحديد الميزة في domain layer',
    '2. إنشاء use case في application layer',
    '3. إنشاء repository في infrastructure layer',
    '4. إنشاء controller وroutes في interface layer',
    '5. إضافة أنواع البيانات في shared layer',
    '6. كتابة اختبارات لكل طبقة',
    '7. تحديث التوثيق'
  ],

  // 2. إصلاح خطأ
  fixBug: [
    '1. تحديد موقع الخطأ في الطبقات',
    '2. إصلاح منطق الأعمال في domain layer',
    '3. تحديث use case إذا لزم الأمر',
    '4. إصلاح repository أو service',
    '5. اختبار الإصلاح',
    '6. تحديث التوثيق إذا تغير السلوك'
  ],

  // 3. إضافة اختبار
  addTest: [
    '1. كتابة اختبار unit للـ domain logic',
    '2. كتابة اختبار integration للـ use case',
    '3. كتابة اختبار e2e لسير العمل الكامل',
    '4. تشغيل جميع الاختبارات',
    '5. تحديث coverage report'
  ]
};

// مثال على كيفية تنظيم المهام المجدولة

export const cronJobOrganization = `
cron/
├── settlement-generator.js       # توليد التسويات اليومية
├── finance-health-check.js       # فحص صحة النظام المالي
├── daily-reconciliation.js       # توليد التقارير اليومية
├── weekly-payouts.js             # معالجة دفعات السائقين الأسبوعية
├── monthly-commission-report.js  # تقرير العمولات الشهري
└── notification-sender.js        # إرسال التنبيهات والإشعارات

// مثال على محتوى ملف cron job
const { runDailyFinanceChecks } = require('../services/finance/monitoring.service');

async function runFinanceHealthCheck() {
  try {
    await runDailyFinanceChecks();
    console.log('✅ Daily finance check completed successfully');
  } catch (error) {
    console.error('❌ Daily finance check failed:', error);
    // Send alert to monitoring system
  }
}

runFinanceHealthCheck();
`;

// مثال على كيفية تنظيم الاختبارات

export const testingOrganization = `
tests/
├── unit/
│   ├── domain/
│   │   ├── settlement.domain.test.ts
│   │   └── wallet.domain.test.ts
│   ├── services/
│   │   ├── settlement-calculator.service.test.ts
│   │   └── payout-processor.service.test.ts
│   └── repositories/
│       ├── settlement.repository.test.ts
│       └── wallet-account.repository.test.ts
│
├── integration/
│   ├── settlement-workflow.test.ts
│   ├── payout-workflow.test.ts
│   └── wallet-operations.test.ts
│
├── e2e/
│   ├── settlement-end-to-end.test.ts
│   └── payout-end-to-end.test.ts
│
└── performance/
    ├── settlement-generation.perf.test.ts
    └── csv-export.perf.test.ts
`;

// مثال على كيفية تنظيم التوثيق

export const documentationOrganization = `
docs/
├── finance/
│   ├── README.md                 # دليل المطور الرئيسي
│   ├── api/
│   │   ├── settlements-api.md    # توثيق API التسويات
│   │   ├── payouts-api.md        # توثيق API الدفعات
│   │   └── wallet-api.md         # توثيق API المحافظ
│   ├── guides/
│   │   ├── settlement-guide.md   # دليل إنشاء التسويات
│   │   ├── payout-guide.md       # دليل إنشاء الدفعات
│   │   └── wallet-guide.md       # دليل إدارة المحافظ
│   ├── specifications/
│   │   ├── csv-formats.md        # مواصفات ملفات CSV
│   │   ├── data-models.md        # نماذج البيانات
│   │   └── business-rules.md     # قواعد الأعمال
│   └── examples/
│       ├── query-examples.md     # عينات الاستعلامات
│       └── integration-examples.md # أمثلة التكامل
`;

// مثال على كيفية استخدام الهيكل في التطوير اليومي

export const dailyDevelopmentWorkflow = {
  // تطوير ميزة جديدة
  featureDevelopment: [
    'ابدأ في domain layer - حدد قواعد الأعمال',
    'انتقل إلى application layer - أنشئ use case',
    'اذهب إلى infrastructure layer - أنشئ repository',
    'انتقل إلى interface layer - أنشئ controller وroutes',
    'أضف الأنواع في shared layer',
    'اكتب اختبارات لكل طبقة',
    'حدث التوثيق'
  ],

  // مراجعة كود زميل
  codeReview: [
    'تحقق من اتباع مبادئ Domain-Driven Design',
    'تأكد من وجود اختبارات كافية',
    'تحقق من التوثيق والتعليقات',
    'تأكد من اتباع معايير الأمان',
    'تحقق من الأداء والتحسين'
  ],

  // نشر التحديثات
  deployment: [
    'تشغيل جميع الاختبارات',
    'تحديث التوثيق إذا لزم الأمر',
    'نشر التحديثات للـ staging',
    'اختبار شامل في الـ staging',
    'نشر للإنتاج بعد الموافقة'
  ]
};
