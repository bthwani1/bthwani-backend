/**
 * عينات استعلامات وعمليات جاهزة للاستخدام
 * هذه العينات تُظهر كيفية استخدام النظام المالي
 */

// أ) توليد تسوية (Pseudo-SQL)
// جميع المبالغ المتاحة لمدفوع لِسائِق خلال الفترة وغير مُسوّاة

export const generateSettlementQuery = `
-- جميع المبالغ المتاحة لمدفوع لِسائِق خلال الفترة وغير مُسوّاة:
WITH eligible AS (
  SELECT account_id, SUM(amount) AS amt
  FROM ledger_splits ls
  JOIN ledger_entries le ON le.id=ls.entry_id
  WHERE ls.balance_state='available'
    AND ls.account_id IN (SELECT id FROM wallet_accounts WHERE owner_type='driver')
    AND le.created_at >= :from AND le.created_at < :to
    AND ls.settlement_line_id IS NULL
  GROUP BY account_id
)
INSERT INTO settlements(...) VALUES (...);
-- ثم INSERT settlement_lines للسجلات المفصلة مع ربط ledger_split.settlement_line_id
`;

// ب) تقرير توازن يومي
export const dailyBalanceReportQuery = `
SELECT DATE(le.created_at) AS d,
       le.id,
       SUM(CASE WHEN ls.side='debit' THEN ls.amount ELSE 0 END) AS total_debit,
       SUM(CASE WHEN ls.side='credit' THEN ls.amount ELSE 0 END) AS total_credit
FROM ledger_entries le
JOIN ledger_splits ls ON ls.entry_id = le.id
WHERE le.created_at >= :day AND le.created_at < :day + INTERVAL '1 day'
GROUP BY d, le.id
HAVING SUM(CASE WHEN ls.side='debit' THEN ls.amount ELSE 0 END)
     <> SUM(CASE WHEN ls.side='credit' THEN ls.amount ELSE 0 END);
-- يجب أن يرجع صفر صفوف
`;

// ج) مطابقة مجاميع الفترة
export const periodReconciliationQuery = `
-- مجاميع نصيب السائقين من الأوامر المؤكدة بالتسليم:
SELECT SUM(driver_share) FROM orders
WHERE delivered_at >= :from AND delivered_at < :to;

-- المتاح في المحافظ (مصدره التسليم):
SELECT SUM(ls.amount) FROM ledger_splits ls
JOIN ledger_entries le ON le.id=ls.entry_id
WHERE ls.balance_state='available'
  AND le.event_type='ORDER_DELIVERED'
  AND le.created_at >= :from AND le.created_at < :to;

-- صافي التسويات المدفوعة:
SELECT SUM(net_amount) FROM settlements
WHERE type='driver' AND status='paid'
  AND paid_at >= :from AND paid_at < :to;
`;

// عينات عمليات جاهزة للاستخدام

export const sampleOperations = {
  // 1. إنشاء تسوية للسائقين لشهر محدد
  createDriverSettlement: `
    POST /finance/settlements/generate
    {
      "type": "driver",
      "period_start": "2025-09-01",
      "period_end": "2025-09-30"
    }

    Response:
    {
      "message": "Settlement generated successfully",
      "settlement": {
        "id": "S-202509-0001",
        "type": "driver",
        "period_start": "2025-09-01T00:00:00.000Z",
        "period_end": "2025-09-30T23:59:59.999Z",
        "status": "ready",
        "gross_amount": 150000,
        "fees": 0,
        "adjustments": 0,
        "net_amount": 150000
      },
      "lines_count": 45,
      "total_gross_amount": 150000,
      "total_fees": 0,
      "total_adjustments": 0,
      "total_net_amount": 150000
    }
  `,

  // 2. تعليم التسوية كمدفوعة
  markSettlementAsPaid: `
    PATCH /finance/settlements/S-202509-0001/mark-paid

    Response:
    {
      "message": "Settlement marked as paid successfully",
      "settlement": {
        "id": "S-202509-0001",
        "status": "paid",
        "paid_at": "2025-10-01T10:30:00.000Z",
        "paid_by": "admin-user-id"
      }
    }
  `,

  // 3. تصدير تسوية إلى CSV
  exportSettlementCSV: `
    GET /finance/settlements/S-202509-0001/export.csv

    CSV Content:
    settlement_id,type,period_start,period_end,currency,line_id,ref_type,ref_id,description,amount,gross_amount,fees,adjustments,net_amount,payable_account_id
    S-202509-0001,driver,2025-09-01,2025-09-30,SAR,10,order,ORD-12345,"Order 12345",1500,150000,0,0,150000,WA-DRV-9
    S-202509-0001,driver,2025-09-01,2025-09-30,SAR,11,order,ORD-12346,"Order 12346",2200,150000,0,0,150000,WA-DRV-9
  `,

  // 4. إنشاء دفعة سائقين
  createPayoutBatch: `
    POST /finance/payouts/generate
    {
      "period_start": "2025-09-01",
      "period_end": "2025-09-30",
      "min_amount": 100
    }

    Response:
    {
      "message": "Payout batch generated successfully",
      "batch": {
        "id": "PB-202509-0001",
        "period_start": "2025-09-01T00:00:00.000Z",
        "period_end": "2025-09-30T23:59:59.999Z",
        "status": "draft",
        "total_count": 23,
        "total_amount": 145000
      },
      "items_count": 23,
      "total_amount": 145000,
      "drivers_included": 23
    }
  `,

  // 5. معالجة دفعة السائقين
  processPayoutBatch: `
    PATCH /finance/payouts/PB-202509-0001/process

    Response:
    {
      "message": "Payout batch processed successfully",
      "batch": {
        "id": "PB-202509-0001",
        "status": "paid",
        "processed_at": "2025-10-01T11:00:00.000Z",
        "processed_by": "admin-user-id"
      }
    }
  `,

  // 6. تصدير دفعة إلى CSV للبنك
  exportPayoutCSV: `
    GET /finance/payouts/PB-202509-0001/export.csv

    CSV Content:
    batch_id,item_id,driver_id,beneficiary,amount,currency,memo,export_ref
    PB-202509-0001,1,DRV-001,IBAN-SA1234567890,5000,SAR,"Driver payout Sep-2025","BNKROW-001"
    PB-202509-0001,2,DRV-002,IBAN-SA0987654321,7500,SAR,"Driver payout Sep-2025","BNKROW-002"
  `,

  // 7. عرض كشف محفظة السائق
  getWalletStatement: `
    GET /finance/payouts/wallet-statement/WA-DRV-001?date_from=2025-09-01&date_to=2025-09-30

    Response:
    {
      "account_id": "WA-DRV-001",
      "statement_lines": [
        {
          "date": "2025-09-15T10:30:00.000Z",
          "memo": "Order 12345",
          "ref_type": "order",
          "ref_id": "ORD-12345",
          "side": "credit",
          "amount": 1500,
          "balance_state": "available",
          "running_balance": 1500
        }
      ],
      "count": 1
    }
  `,

  // 8. تصدير كشف محفظة إلى CSV
  exportWalletStatementCSV: `
    GET /finance/payouts/wallet-statement/WA-DRV-001/export.csv?date_from=2025-09-01&date_to=2025-09-30

    CSV Content:
    date,entry_id,split_id,memo,ref_type,ref_id,side,amount,balance_state,running_balance
    2025-09-15T10:30:00.000Z,LE-001,LS-001,"Order 12345",order,ORD-12345,credit,1500,available,1500
  `,

  // 9. تقرير المطابقة اليومي
  dailyReconciliation: `
    GET /finance/reports/daily-comparison/2025-09-15

    Response:
    {
      "message": "Daily report comparison generated successfully",
      "comparison": {
        "date": "2025-09-15T00:00:00.000Z",
        "orders_total": 25000,
        "orders_count": 15,
        "wallet_statement_total": 25000,
        "wallet_statement_count": 15,
        "discrepancy": 0,
        "discrepancy_percentage": 0
      }
    }
  `,

  // 10. مقاييس النظام المالي
  financeMetrics: `
    GET /finance/monitoring/metrics

    Response:
    {
      "message": "Finance metrics retrieved successfully",
      "metrics": {
        "ledger_unbalanced_count": 0,
        "unsettled_available_sum": 2500,
        "payout_failed_count": 0,
        "total_settlements_pending": 5,
        "total_payouts_processing": 1,
        "wallet_accounts_with_negative_balance": 0,
        "last_updated": "2025-10-01T12:00:00.000Z"
      }
    }
  `,

  // 11. حالة صحة النظام المالي
  financeHealth: `
    GET /finance/monitoring/health

    Response:
    {
      "message": "Finance system health status retrieved",
      "health": {
        "status": "healthy",
        "timestamp": "2025-10-01T12:00:00.000Z",
        "metrics": {
          "ledger_unbalanced_count": 0,
          "unsettled_available_sum": 2500,
          "payout_failed_count": 0,
          "total_settlements_pending": 5,
          "total_payouts_processing": 1,
          "wallet_accounts_with_negative_balance": 0,
          "last_updated": "2025-10-01T12:00:00.000Z"
        },
        "issues": []
      }
    }
  `,

  // 12. قائمة قواعد العمولة
  commissionRules: `
    GET /finance/commissions/rules

    Response:
    {
      "rules": [
        {
          "_id": "rule-1",
          "applicable_to": "driver",
          "basis": "percentage",
          "value": 15,
          "min": 10,
          "max": 50,
          "effective_from": "2025-01-01T00:00:00.000Z",
          "priority": 1,
          "is_active": true,
          "created_by": {
            "_id": "admin-1",
            "fullName": "Finance Admin",
            "email": "admin@bthwani.com"
          }
        }
      ],
      "count": 1
    }
  `
};

// استعلامات متقدمة للمطورين

export const advancedQueries = {
  // تحليل أداء السائقين
  driverPerformance: `
    SELECT
      d.fullName,
      COUNT(o._id) as total_orders,
      SUM(o.deliveryFee) as total_earnings,
      AVG(o.deliveryFee) as avg_earning_per_order,
      SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders
    FROM drivers d
    LEFT JOIN orders o ON d._id = o.driver
    WHERE o.deliveredAt >= :from AND o.deliveredAt < :to
    GROUP BY d._id, d.fullName
    ORDER BY total_earnings DESC;
  `,

  // تحليل التسويات حسب الفترة
  settlementAnalysis: `
    SELECT
      s.type,
      DATE_FORMAT(s.period_start, '%Y-%m') as period,
      COUNT(s._id) as settlement_count,
      SUM(s.net_amount) as total_amount,
      AVG(s.net_amount) as avg_settlement_amount
    FROM settlements s
    WHERE s.status = 'paid'
      AND s.paid_at >= :from AND s.paid_at < :to
    GROUP BY s.type, DATE_FORMAT(s.period_start, '%Y-%m')
    ORDER BY period DESC, s.type;
  `,

  // مراقبة الرصيد المتاح للسائقين
  availableBalanceMonitoring: `
    SELECT
      wa.owner_id,
      d.fullName,
      wa.currency,
      SUM(CASE WHEN ls.balance_state = 'available' AND ls.side = 'credit' THEN ls.amount ELSE 0 END) -
      SUM(CASE WHEN ls.balance_state = 'available' AND ls.side = 'debit' THEN ls.amount ELSE 0 END) as available_balance
    FROM wallet_accounts wa
    JOIN drivers d ON wa.owner_id = d._id
    LEFT JOIN ledger_splits ls ON wa._id = ls.account_id
    WHERE wa.owner_type = 'driver' AND wa.status = 'active'
    GROUP BY wa.owner_id, d.fullName, wa.currency
    HAVING available_balance > 0
    ORDER BY available_balance DESC;
  `,

  // تحليل العمولات المحصلة
  commissionAnalysis: `
    SELECT
      cr.applicable_to,
      cr.basis,
      cr.value,
      COUNT(le._id) as usage_count,
      SUM(CASE WHEN ls.side = 'debit' THEN ls.amount ELSE 0 END) as total_commission_collected
    FROM commission_rules cr
    LEFT JOIN ledger_entries le ON le.event_type = 'order_commission'
    LEFT JOIN ledger_splits ls ON ls.entry_id = le._id AND ls.account_type = 'company_revenue'
    WHERE cr.is_active = true
      AND (cr.effective_to IS NULL OR cr.effective_to >= NOW())
    GROUP BY cr._id, cr.applicable_to, cr.basis, cr.value
    ORDER BY total_commission_collected DESC;
  `,

  // مراقبة القيود غير المتوازنة
  unbalancedLedgers: `
    SELECT
      le.id,
      le.event_type,
      le.event_ref,
      le.description,
      le.total_debit,
      le.total_credit,
      le.is_balanced,
      le.created_at
    FROM ledger_entries le
    WHERE le.is_balanced = false
       OR le.total_debit != le.total_credit
    ORDER BY le.created_at DESC;
  `
};

// أمثلة على استخدام API مع أخطاء محتملة

export const errorHandlingExamples = {
  // خطأ في إنشاء تسوية بدون صلاحية
  unauthorizedSettlement: `
    POST /finance/settlements/generate
    {
      "type": "driver",
      "period_start": "2025-09-01",
      "period_end": "2025-09-30"
    }

    Response (403):
    {
      "message": "ليس لديك صلاحية للوصول إلى هذه الميزة",
      "error": {
        "code": "INSUFFICIENT_FINANCE_PERMISSIONS",
        "required": ["finance:settlement:create"],
        "user_role": "Driver"
      }
    }
  `,

  // خطأ في محاولة الوصول إلى محفظة شخص آخر
  unauthorizedWalletAccess: `
    GET /finance/wallet/balance?account_id=WA-DRV-OTHER

    Response (403):
    {
      "message": "يمكنك الوصول إلى محفظتك الخاصة فقط",
      "error": {
        "code": "WALLET_ACCESS_DENIED",
        "requested_account": "WA-DRV-OTHER",
        "user_account": "WA-DRV-001"
      }
    }
  `,

  // خطأ في رابط عميق غير مصرح
  unauthorizedDeepLink: `
    GET /finance/settlements/S-202509-0001

    Response (404):
    {
      "message": "الصفحة غير موجودة",
      "error": {
        "code": "PAGE_NOT_FOUND"
      }
    }
  `
};

// مثال على كيفية استخدام النظام في سكريبت تلقائي

export const automationExample = `
const axios = require('axios');

// مثال على سكريبت تلقائي للتحقق اليومي من التوازن
async function dailyFinanceCheck() {
  try {
    // 1. التحقق من توازن القيود
    const balanceCheck = await axios.get('http://localhost:3000/finance/reconciliation/validate-balance', {
      params: {
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    });

    if (!balanceCheck.data.is_balanced) {
      console.error('❌ قيود غير متوازنة:', balanceCheck.data.unbalanced_entries.length);
      // إرسال تنبيه
      await sendAlert('قيود محاسبية غير متوازنة', 'critical');
    }

    // 2. التحقق من الأرصدة المتاحة غير المسواة
    const metrics = await axios.get('http://localhost:3000/finance/monitoring/metrics');

    if (metrics.data.metrics.unsettled_available_sum > 10000) {
      console.warn('⚠️ أرصدة متاحة غير مسواة كبيرة:', metrics.data.metrics.unsettled_available_sum);
      await sendAlert('أرصدة متاحة غير مسواة لفترة طويلة', 'high');
    }

    // 3. توليد تقرير المطابقة اليومي
    const report = await axios.get('http://localhost:3000/finance/reports/daily-comparison/' + new Date().toISOString().split('T')[0]);

    if (Math.abs(report.data.comparison.discrepancy) > 100) {
      console.error('❌ فروقات في المطابقة اليومية:', report.data.comparison.discrepancy);
      await sendAlert('فروقات في المطابقة اليومية', 'medium');
    }

    console.log('✅ فحص النظام المالي مكتمل');

  } catch (error) {
    console.error('❌ خطأ في فحص النظام المالي:', error.message);
    await sendAlert('خطأ في فحص النظام المالي', 'critical');
  }
}

async function sendAlert(title, severity) {
  // إرسال تنبيه عبر Slack/Email/etc
  console.log(\`تنبيه: \${severity} - \${title}\`);
}

// تشغيل الفحص يوميًا
setInterval(dailyFinanceCheck, 24 * 60 * 60 * 1000);
`;

// مثال على كيفية استخدام النظام في التطبيق

export const integrationExample = `
import { getWalletBalance, getWalletStatement, generateSettlement } from './api/finance';

// مثال على صفحة محفظة السائق في التطبيق
class DriverWalletPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      balance: null,
      statement: [],
      loading: true
    };
  }

  async componentDidMount() {
    try {
      // 1. جلب رصيد المحفظة
      const balanceResponse = await getWalletBalance();
      this.setState({ balance: balanceResponse.balance });

      // 2. جلب كشف المحفظة للشهر الحالي
      const statementResponse = await getWalletStatement(
        balanceResponse.account.id,
        {
          date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          date_to: new Date().toISOString().split('T')[0]
        }
      );
      this.setState({ statement: statementResponse.statement_lines });

    } catch (error) {
      console.error('خطأ في جلب بيانات المحفظة:', error);
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const { balance, statement, loading } = this.state;

    if (loading) return <LoadingSpinner />;

    return (
      <div className="wallet-page">
        <WalletBalanceCard balance={balance} />

        <div className="wallet-actions">
          <button onClick={() => this.exportStatement()}>
            تصدير كشف الحساب
          </button>
        </div>

        <WalletStatementTable statement={statement} />
      </div>
    );
  }

  async exportStatement() {
    try {
      const blob = await exportWalletStatementToCSV(
        balance.account.id,
        {
          date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          date_to: new Date().toISOString().split('T')[0]
        }
      );

      // تحميل الملف
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`wallet-statement-\${new Date().toISOString().split('T')[0]}.csv\`;
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('خطأ في تصدير الكشف:', error);
    }
  }
}
`;

// مثال على كيفية استخدام النظام في لوحة الإدارة

export const adminIntegrationExample = `
import {
  getSettlements,
  generateSettlement,
  markSettlementAsPaid,
  getPayoutBatches,
  processPayoutBatch,
  getFinanceMetrics
} from './api/finance';

// مثال على صفحة إدارة التسويات
class SettlementsAdminPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settlements: [],
      loading: true,
      selectedSettlement: null
    };
  }

  async componentDidMount() {
    await this.loadSettlements();
  }

  async loadSettlements() {
    try {
      const response = await getSettlements({
        page: 1,
        perPage: 20,
        status: 'ready' // تسويات جاهزة للدفع فقط
      });

      this.setState({
        settlements: response.settlements,
        loading: false
      });

    } catch (error) {
      console.error('خطأ في جلب التسويات:', error);
      this.setState({ loading: false });
    }
  }

  async handleGenerateSettlement(type, periodStart, periodEnd) {
    try {
      await generateSettlement({
        type,
        period_start: periodStart,
        period_end: periodEnd
      });

      // إعادة جلب التسويات بعد الإنشاء
      await this.loadSettlements();

      alert('تم إنشاء التسوية بنجاح');

    } catch (error) {
      console.error('خطأ في إنشاء التسوية:', error);
      alert('فشل في إنشاء التسوية: ' + error.message);
    }
  }

  async handleMarkAsPaid(settlementId) {
    try {
      await markSettlementAsPaid(settlementId);

      // إعادة جلب التسويات بعد التحديث
      await this.loadSettlements();

      alert('تم تعليم التسوية كمدفوعة');

    } catch (error) {
      console.error('خطأ في تعليم التسوية كمدفوعة:', error);
      alert('فشل في تعليم التسوية كمدفوعة: ' + error.message);
    }
  }

  render() {
    const { settlements, loading } = this.state;

    return (
      <div className="settlements-admin-page">
        <div className="page-header">
          <h1>إدارة التسويات</h1>
          <button onClick={() => this.showGenerateDialog()}>
            إنشاء تسوية جديدة
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <SettlementsTable
            settlements={settlements}
            onMarkAsPaid={(id) => this.handleMarkAsPaid(id)}
            onViewDetails={(settlement) => this.showSettlementDetails(settlement)}
          />
        )}

        <GenerateSettlementDialog
          open={this.state.generateDialogOpen}
          onClose={() => this.setState({ generateDialogOpen: false })}
          onGenerate={(data) => this.handleGenerateSettlement(data.type, data.periodStart, data.periodEnd)}
        />
      </div>
    );
  }
}
`;
