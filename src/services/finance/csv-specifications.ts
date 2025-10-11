/**
 * مواصفات CSV للنظام المالي
 * توثيق مفصل لتنسيقات ملفات CSV المستخدمة في النظام
 */

// =====================================================
// Settlement CSV مواصفات ملف CSV للتسويات
// =====================================================

export const SETTLEMENT_CSV_SPEC = {
  filename: 'settlement-{settlement_id}.csv',
  description: 'ملف CSV يحتوي على تفاصيل التسوية وبنودها للمراجعة المالية',

  headers: [
    'settlement_id',
    'type',
    'period_start',
    'period_end',
    'currency',
    'line_id',
    'ref_type',
    'ref_id',
    'description',
    'amount',
    'gross_amount',
    'fees',
    'adjustments',
    'net_amount',
    'payable_account_id'
  ],

  headerDescriptions: {
    settlement_id: 'معرف التسوية (S-YYYYMM-####)',
    type: 'نوع التسوية (driver/vendor)',
    period_start: 'تاريخ بداية الفترة (ISO 8601)',
    period_end: 'تاريخ نهاية الفترة (ISO 8601)',
    currency: 'العملة (SAR)',
    line_id: 'معرف بند التسوية',
    ref_type: 'نوع المرجع (order/manual_adjustment)',
    ref_id: 'معرف المرجع (رقم الطلب أو المرجع الخارجي)',
    description: 'وصف البند',
    amount: 'مبلغ البند (إيجابي للمبالغ المستحقة)',
    gross_amount: 'إجمالي مبلغ التسوية قبل الخصم',
    fees: 'إجمالي الرسوم',
    adjustments: 'إجمالي التعديلات',
    net_amount: 'صافي مبلغ التسوية',
    payable_account_id: 'معرف حساب المحفظة المستحقة'
  },

  exampleRow: `S-202509-0001,driver,2025-09-01T00:00:00.000Z,2025-09-30T23:59:59.999Z,SAR,10,order,ORD-12345,"Order 12345 - Delivery to Riyadh",1500,150000,0,0,150000,WA-DRV-9`,

  validationRules: {
    settlement_id: 'يجب أن يبدأ بـ S- ويتبع تنسيق S-YYYYMM-####',
    type: 'يجب أن يكون driver أو vendor',
    currency: 'يجب أن يكون SAR حاليًا',
    amount: 'يجب أن يكون رقم إيجابي',
    ref_type: 'يجب أن يكون order أو manual_adjustment'
  },

  useCases: [
    'مراجعة تفاصيل التسوية قبل الدفع',
    'تدقيق المبالغ المستحقة للسائقين/التجار',
    'تحليل أنماط الدفع والتسويات',
    'تصدير البيانات للنظم المحاسبية الخارجية'
  ]
};

// =====================================================
// Payout CSV مواصفات ملف CSV للدفعات
// =====================================================

export const PAYOUT_CSV_SPEC = {
  filename: 'payout-batch-{batch_id}.csv',
  description: 'ملف CSV يحتوي على تفاصيل دفعة السائقين للتصدير إلى البنك أو PSP',

  headers: [
    'batch_id',
    'item_id',
    'driver_id',
    'beneficiary',
    'amount',
    'currency',
    'memo',
    'export_ref'
  ],

  headerDescriptions: {
    batch_id: 'معرف دفعة السائقين (PB-YYYYMM-####)',
    item_id: 'معرف عنصر الدفعة',
    driver_id: 'معرف السائق',
    beneficiary: 'معلومات المستفيد (IBAN أو رقم الهاتف)',
    amount: 'مبلغ الدفعة',
    currency: 'العملة (SAR)',
    memo: 'ملاحظة الدفعة',
    export_ref: 'مرجع التصدير للبنك/PSP'
  },

  exampleRow: `PB-202509-0002,7,DRV-9,IBAN-SA1234567890123456789012,200000,SAR,"Monthly payout Sep-2025","BNKROW-9981"`,

  validationRules: {
    batch_id: 'يجب أن يبدأ بـ PB- ويتبع تنسيق PB-YYYYMM-####',
    amount: 'يجب أن يكون رقم إيجابي',
    currency: 'يجب أن يكون SAR حاليًا',
    beneficiary: 'يجب أن يكون IBAN صالح أو رقم هاتف صالح'
  },

  useCases: [
    'تصدير ملف دفعات للبنوك',
    'تكامل مع أنظمة الدفع الإلكتروني (PSP)',
    'مراجعة دفعات السائقين قبل التنفيذ',
    'تسجيل المدفوعات في النظم المحاسبية'
  ]
};

// =====================================================
// Wallet Statement CSV مواصفات كشف المحفظة
// =====================================================

export const WALLET_STATEMENT_CSV_SPEC = {
  filename: 'wallet-statement-{account_id}.csv',
  description: 'ملف CSV يحتوي على كشف حساب مفصل لمحفظة السائق أو التاجر',

  headers: [
    'date',
    'entry_id',
    'split_id',
    'memo',
    'ref_type',
    'ref_id',
    'side',
    'amount',
    'balance_state',
    'running_balance'
  ],

  headerDescriptions: {
    date: 'تاريخ العملية (ISO 8601)',
    entry_id: 'معرف قيد دفتر الأستاذ',
    split_id: 'معرف تفصيل القيد',
    memo: 'وصف العملية',
    ref_type: 'نوع المرجع (order/settlement/payout)',
    ref_id: 'معرف المرجع',
    side: 'جانب العملية (debit/credit)',
    amount: 'مبلغ العملية',
    balance_state: 'حالة الرصيد (pending/available)',
    running_balance: 'الرصيد الجاري بعد العملية'
  },

  exampleRow: `2025-09-15T10:30:00.000Z,LE-778,LS-992,"Order 12345 delivery payment",order,ORD-12345,credit,1500,available,1500`,

  validationRules: {
    date: 'يجب أن يكون تاريخ ISO 8601 صالح',
    side: 'يجب أن يكون debit أو credit',
    balance_state: 'يجب أن يكون pending أو available',
    amount: 'يجب أن يكون رقم صالح (إيجابي للدخل، سالب للخصم)',
    running_balance: 'يجب أن يكون رقم صالح'
  },

  useCases: [
    'عرض كشف حساب مفصل للسائق/التاجر',
    'تصدير البيانات للمراجعة الشخصية',
    'تحليل أنماط الدخل والإنفاق',
    'تسوية الحسابات الشخصية'
  ]
};

// =====================================================
// Daily Comparison CSV مواصفات مقارنة يومية
// =====================================================

export const DAILY_COMPARISON_CSV_SPEC = {
  filename: 'daily-comparison-{date}.csv',
  description: 'ملف CSV يحتوي على مقارنة شاملة بين الطلبات وكشف المحفظة ليوم محدد',

  sections: {
    summary: {
      headers: [
        'date',
        'orders_total',
        'orders_count',
        'wallet_statement_total',
        'wallet_statement_count',
        'discrepancy',
        'discrepancy_percentage'
      ],
      description: 'ملخص المقارنة اليومية'
    },

    orders: {
      headers: [
        'order_id',
        'delivered_at',
        'customer_address',
        'driver_name',
        'driver_phone',
        'store_name',
        'store_items',
        'store_share',
        'subtotal',
        'delivery_fee',
        'company_share',
        'platform_share',
        'total_amount'
      ],
      description: 'تفاصيل الطلبات المكتملة في اليوم'
    },

    wallet_statement: {
      headers: [
        'statement_id',
        'date',
        'memo',
        'ref_type',
        'ref_id',
        'side',
        'amount',
        'balance_state',
        'running_balance',
        'entry_event_type',
        'entry_description',
        'account_owner_type',
        'account_owner_id'
      ],
      description: 'تفاصيل عمليات المحفظة في اليوم'
    }
  },

  exampleRow: `=== DAILY COMPARISON SUMMARY ===
2025-09-15,25000,15,25000,15,0,0.00%

=== ORDERS DETAILS ===
ORD-12345,2025-09-15T14:30:00.000Z,"Al Olaya, Riyadh",Ahmed Al-Saud,+966501234567,Mahmoud Restaurant,3,1200,1500,300,300,300,1800

=== WALLET STATEMENT DETAILS ===
LS-001,2025-09-15T14:30:00.000Z,"Order 12345 delivery",order,ORD-12345,credit,1500,available,1500,ORDER_DELIVERED,"Order delivery payment",driver,DRV-001`,

  useCases: [
    'التحقق من تطابق البيانات بين الطلبات والمحافظ',
    'كشف الأخطاء في التسجيل المالي',
    'تحليل أداء النظام المالي',
    'تدقيق العمليات المالية اليومية'
  ]
};

// =====================================================
// مواصفات عامة لجميع ملفات CSV
// =====================================================

export const CSV_COMMON_SPEC = {
  encoding: 'UTF-8',
  delimiter: ',',
  quote: '"',
  escape: '"',

  formatting: {
    dates: 'ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
    numbers: 'بدون فواصل للآلاف، مع نقطتين عشريتين',
    currency: 'رمز العملة في عمود منفصل',
    text: 'نصوص طويلة محاطة بعلامات تنصيص مزدوجة'
  },

  validation: {
    required_fields: 'جميع الحقول المطلوبة يجب أن تكون موجودة',
    data_types: 'التحقق من أنواع البيانات حسب المواصفات',
    encoding: 'يجب أن يكون الملف محفوظ بترميز UTF-8',
    line_endings: 'يجب استخدام نهاية السطر Unix (LF) أو Windows (CRLF)'
  },

  bestPractices: [
    'استخدام عناوين واضحة ومفهومة',
    'تجنب استخدام فواصل في الأرقام',
    'التحقق من صحة البيانات قبل التصدير',
    'إضافة تعليقات توضيحية في الملف عند الحاجة',
    'استخدام تنسيقات تاريخ موحدة'
  ]
};

// =====================================================
// أدوات مساعدة للتحقق من صحة CSV
// =====================================================

export const CSV_VALIDATION_UTILS = {
  /**
   * التحقق من صحة هيكل ملف CSV للتسويات
   */
  validateSettlementCSV: (csvContent: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      errors.push('الملف يجب أن يحتوي على رأس وعلى الأقل سطر واحد من البيانات');
      return { valid: false, errors };
    }

    const headers = lines[0].split(',');
    const expectedHeaders = SETTLEMENT_CSV_SPEC.headers;

    // التحقق من وجود جميع العناوين المطلوبة
    for (const expectedHeader of expectedHeaders) {
      if (!headers.includes(expectedHeader)) {
        errors.push(`العنوان المطلوب مفقود: ${expectedHeader}`);
      }
    }

    // التحقق من صحة البيانات في السطور
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length !== expectedHeaders.length) {
        errors.push(`السطر ${i + 1}: عدد الحقول غير صحيح (${values.length} بدلاً من ${expectedHeaders.length})`);
      }
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * التحقق من صحة هيكل ملف CSV للدفعات
   */
  validatePayoutCSV: (csvContent: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      errors.push('الملف يجب أن يحتوي على رأس وعلى الأقل سطر واحد من البيانات');
      return { valid: false, errors };
    }

    const headers = lines[0].split(',');
    const expectedHeaders = PAYOUT_CSV_SPEC.headers;

    for (const expectedHeader of expectedHeaders) {
      if (!headers.includes(expectedHeader)) {
        errors.push(`العنوان المطلوب مفقود: ${expectedHeader}`);
      }
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * التحقق من صحة هيكل ملف CSV لكشف المحفظة
   */
  validateWalletStatementCSV: (csvContent: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      errors.push('الملف يجب أن يحتوي على رأس وعلى الأقل سطر واحد من البيانات');
      return { valid: false, errors };
    }

    const headers = lines[0].split(',');
    const expectedHeaders = WALLET_STATEMENT_CSV_SPEC.headers;

    for (const expectedHeader of expectedHeaders) {
      if (!headers.includes(expectedHeader)) {
        errors.push(`العنوان المطلوب مفقود: ${expectedHeader}`);
      }
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * إصلاح مشاكل التنسيق الشائعة في ملفات CSV
   */
  fixCSVFormatting: (csvContent: string): string => {
    return csvContent
      // إزالة المسافات الزائدة
      .replace(/,\s+/g, ',')
      .replace(/\s+,/g, ',')
      // إصلاح علامات التنصيص المزدوجة المفقودة للنصوص الطويلة
      .replace(/([^,]+,[^,]*[,\n])/g, (match) => {
        const parts = match.split(',');
        if (parts.length > 1 && !parts[parts.length - 2].startsWith('"')) {
          parts[parts.length - 2] = `"${parts[parts.length - 2]}"`;
        }
        return parts.join(',');
      });
  }
};

// مثال على استخدام أدوات التحقق

export const validationExamples = {
  // مثال على التحقق من ملف تسوية
  validateSettlementExample: `
const csvContent = \`settlement_id,type,period_start,period_end,currency,line_id,ref_type,ref_id,description,amount,gross_amount,fees,adjustments,net_amount,payable_account_id
S-202509-0001,driver,2025-09-01,2025-09-30,SAR,10,order,ORD-12345,"Order 12345",1500,150000,0,0,150000,WA-DRV-9\`;

const validation = CSV_VALIDATION_UTILS.validateSettlementCSV(csvContent);

if (!validation.valid) {
  console.error('أخطاء في ملف CSV:', validation.errors);
} else {
  console.log('ملف CSV صالح');
}
  `,

  // مثال على إصلاح تنسيق CSV
  fixCSVExample: `
const malformedCSV = \`settlement_id , type , period_start
S-202509-0001,driver,2025-09-01\`;

const fixedCSV = CSV_VALIDATION_UTILS.fixCSVFormatting(malformedCSV);
console.log('النتيجة بعد الإصلاح:', fixedCSV);
  `
};

// إحصائيات الاستخدام والأداء

export const CSV_USAGE_STATS = {
  averageFileSize: {
    settlement: 'حوالي 10-50 كيلوبايت للتسوية الواحدة',
    payout: 'حوالي 5-20 كيلوبايت للدفعة الواحدة',
    wallet_statement: 'حوالي 50-200 كيلوبايت لكشف شهري'
  },

  generationTime: {
    settlement: '2-5 ثوانٍ للتسوية الواحدة',
    payout: '5-15 ثانية للدفعة الواحدة',
    wallet_statement: '1-3 ثوانٍ لكشف يومي'
  },

  commonIssues: [
    'عدم توافق الترميز (يجب أن يكون UTF-8)',
    'خطوط نهاية مختلطة (CRLF مقابل LF)',
    'علامات تنصيص مفقودة للنصوص الطويلة',
    'أعمدة إضافية أو ناقصة',
    'تواريخ بتنسيق خاطئ'
  ],

  recommendations: [
    'استخدام برامج متخصصة في تحرير CSV مثل Excel أو LibreOffice Calc',
    'التحقق من صحة الملف قبل التصدير باستخدام أدوات التحقق',
    'حفظ الملف دائمًا بترميز UTF-8',
    'تجنب استخدام فواصل في الأرقام أو النصوص',
    'التحقق من صحة التواريخ والمبالغ قبل التصدير'
  ]
};

// مثال على كيفية توليد CSV برمجيًا

export const programmaticCSVGeneration = {
  // توليد ملف تسوية برمجيًا
  generateSettlementCSV: (settlement: any, lines: any[]): string => {
    const headers = SETTLEMENT_CSV_SPEC.headers;

    const rows = [
      headers.join(','),
      ...lines.map(line => [
        settlement.id,
        settlement.type,
        settlement.period_start,
        settlement.period_end,
        settlement.currency,
        line._id,
        line.ref_type,
        line.ref_id,
        `"${line.description}"`,
        line.amount,
        settlement.gross_amount,
        settlement.fees,
        settlement.adjustments,
        settlement.net_amount,
        settlement.payable_account_id
      ].join(','))
    ];

    return rows.join('\n');
  },

  // توليد ملف دفعة برمجيًا
  generatePayoutCSV: (batch: any, items: any[]): string => {
    const headers = PAYOUT_CSV_SPEC.headers;

    const rows = [
      headers.join(','),
      ...items.map(item => [
        batch.id,
        item._id,
        item.account_id.owner_id,
        `"${item.beneficiary}"`,
        item.amount,
        batch.currency,
        `"Driver payout ${batch.period_start.split('T')[0]}"`,
        item.export_ref || ''
      ].join(','))
    ];

    return rows.join('\n');
  },

  // توليد كشف محفظة برمجيًا
  generateWalletStatementCSV: (accountId: string, statements: any[]): string => {
    const headers = WALLET_STATEMENT_CSV_SPEC.headers;

    const rows = [
      headers.join(','),
      ...statements.map(statement => [
        statement.date,
        statement.entry_id,
        statement.split_id,
        `"${statement.memo}"`,
        statement.ref_type,
        statement.ref_id || '',
        statement.side,
        statement.amount,
        statement.balance_state,
        statement.running_balance
      ].join(','))
    ];

    return rows.join('\n');
  }
};

// مثال على استخدام التوليد البرمجي

export const programmaticExample = `
import { generateSettlementCSV, generatePayoutCSV } from './csv-specifications';

// توليد ملف CSV للتسوية
const settlementCSV = generateSettlementCSV(settlement, settlementLines);

// توليد ملف CSV للدفعة
const payoutCSV = generatePayoutCSV(payoutBatch, payoutItems);

// حفظ الملفات
fs.writeFileSync('settlement.csv', settlementCSV);
fs.writeFileSync('payout.csv', payoutCSV);
`;

// ملاحظات مهمة للمطورين

export const developerNotes = {
  important: [
    'جميع ملفات CSV يجب أن تكون محفوظة بترميز UTF-8',
    'يجب استخدام علامات تنصيص مزدوجة للنصوص التي تحتوي على فواصل أو مسافات',
    'التواريخ يجب أن تكون بتنسيق ISO 8601 كامل',
    'الأرقام يجب أن تكون بدون فواصل للآلاف',
    'العملة يجب أن تكون في عمود منفصل وليس مع المبلغ'
  ],

  troubleshooting: [
    'إذا ظهرت أحرف غريبة، تحقق من ترميز الملف (يجب UTF-8)',
    'إذا لم يتم فتح الملف بشكل صحيح في Excel، جرب حفظ كـ CSV UTF-8',
    'إذا ظهرت مشاكل في التواريخ، تأكد من تنسيق ISO 8601',
    'إذا لم تظهر الأرقام بشكل صحيح، تحقق من عدم وجود فواصل'
  ],

  bestPractices: [
    'استخدم دائمًا أدوات التحقق قبل التصدير',
    'اختبر الملفات على عينات صغيرة أولاً',
    'احتفظ بنسخ احتياطية من الملفات الأصلية',
    'وثق أي تغييرات في تنسيق الملفات',
    'استشر فريق المالية عند إضافة حقول جديدة'
  ]
};
