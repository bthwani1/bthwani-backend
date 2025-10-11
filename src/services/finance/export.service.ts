import { Types } from 'mongoose';
import DeliveryOrder from '../../models/delivery_marketplace_v1/Order';
import { WalletAccount, WalletStatementLine, LedgerEntry, LedgerSplit } from '../../models/finance';
import { Settlement, SettlementLine } from '../../models/finance';
import { PayoutBatch, PayoutItem } from '../../models/finance';

/**
 * خدمة تصدير البيانات المالية الموحدة
 * تضمن دقة البيانات وتطابق الأرقام بين الشاشات والملفات المصدرة
 */

export interface ExportOptions {
  format: 'csv' | 'excel';
  timezone?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  numberFormat?: 'decimal' | 'financial';
}

export interface ExportResult {
  filename: string;
  content: string | Buffer;
  mimeType: string;
  size: number;
  generatedAt: Date;
  dataSummary: {
    totalRecords: number;
    dateRange: {
      from: Date;
      to: Date;
    };
    totals: Record<string, number>;
  };
}

export interface ReportData {
  summary: {
    totalAmount: number;
    totalCount: number;
    dateRange: {
      from: Date;
      to: Date;
    };
  };
  records: any[];
}

/**
 * خدمة تصدير التقارير المالية الموحدة
 */
export class FinanceExportService {

  /**
   * تصدير تقرير المبيعات
   */
  static async exportSalesReport(
    filters: {
      startDate: Date;
      endDate: Date;
      storeId?: string;
      status?: string;
    },
    options: ExportOptions = { format: 'csv' }
  ): Promise<ExportResult> {
    try {
      const orders = await this.getSalesData(filters);

      const reportData: ReportData = {
        summary: {
          totalAmount: orders.reduce((sum, order) => sum + (order.price || 0), 0),
          totalCount: orders.length,
          dateRange: { from: filters.startDate, to: filters.endDate }
        },
        records: orders.map(order => ({
          orderId: order.id || order._id || 'غير محدد',
          date: order.createdAt || 'غير محدد',
          customer: (order as any).customerName || 'غير محدد',
          store: (order as any).storeName || 'غير محدد',
          items: order.items?.length || 0,
          subtotal: (order as any).subtotal || 0,
          deliveryFee: order.deliveryFee || 0,
          taxes: (order as any).taxes || 0,
          total: order.price || 0,
          status: order.status || 'غير محدد',
          paymentMethod: order.paymentMethod || 'غير محدد'
        }))
      };

      return await this.generateExport('sales-report', reportData, options);
    } catch (error) {
      throw new Error(`فشل في تصدير تقرير المبيعات: ${error}`);
    }
  }

  /**
   * تصدير تقرير المدفوعات
   */
  static async exportPayoutsReport(
    filters: {
      startDate: Date;
      endDate: Date;
      status?: string;
    },
    options: ExportOptions = { format: 'csv' }
  ): Promise<ExportResult> {
    try {
      const payouts = await this.getPayoutsData(filters);

      const reportData: ReportData = {
        summary: {
          totalAmount: payouts.reduce((sum, payout) => sum + (payout.amount || 0), 0),
          totalCount: payouts.length,
          dateRange: { from: filters.startDate, to: filters.endDate }
        },
        records: payouts.map(payout => ({
          payoutId: payout.id || payout._id || 'غير محدد',
          driverId: (payout as any).driverId || 'غير محدد',
          driverName: (payout as any).driverName || 'غير محدد',
          amount: payout.amount || 0,
          fees: payout.fees || 0,
          netAmount: (payout as any).net_amount || 0,
          status: payout.status || 'غير محدد',
          createdAt: payout.createdAt || 'غير محدد',
          processedAt: (payout as any).processedAt || 'غير محدد',
          bankRef: (payout as any).bankRef || ''
        }))
      };

      return await this.generateExport('payouts-report', reportData, options);
    } catch (error) {
      throw new Error(`فشل في تصدير تقرير المدفوعات: ${error}`);
    }
  }

  /**
   * تصدير تقرير الطلبات
   */
  static async exportOrdersReport(
    filters: {
      startDate: Date;
      endDate: Date;
      status?: string;
      storeId?: string;
    },
    options: ExportOptions = { format: 'csv' }
  ): Promise<ExportResult> {
    try {
      const orders = await this.getOrdersData(filters);

      const reportData: ReportData = {
        summary: {
          totalAmount: orders.reduce((sum, order) => sum + (order.price || 0), 0),
          totalCount: orders.length,
          dateRange: { from: filters.startDate, to: filters.endDate }
        },
        records: orders.map(order => ({
          orderId: order.id || order._id || 'غير محدد',
          createdAt: order.createdAt || 'غير محدد',
          customerName: (order as any).customerName || 'غير محدد',
          customerPhone: (order as any).customerPhone || 'غير محدد',
          storeName: (order as any).storeName || 'غير محدد',
          storePhone: (order as any).storePhone || 'غير محدد',
          driverName: (order as any).driverName || 'غير محدد',
          driverPhone: (order as any).driverPhone || 'غير محدد',
          subtotal: (order as any).subtotal || 0,
          deliveryFee: order.deliveryFee || 0,
          taxes: (order as any).taxes || 0,
          total: order.price || 0,
          status: order.status || 'غير محدد',
          paymentMethod: order.paymentMethod || 'غير محدد',
          address: order.address || 'غير محدد'
        }))
      };

      return await this.generateExport('orders-report', reportData, options);
    } catch (error) {
      throw new Error(`فشل في تصدير تقرير الطلبات: ${error}`);
    }
  }

  /**
   * تصدير تقرير الرسوم والضرائب
   */
  static async exportFeesTaxesReport(
    filters: {
      startDate: Date;
      endDate: Date;
      type?: 'fees' | 'taxes' | 'both';
    },
    options: ExportOptions = { format: 'csv' }
  ): Promise<ExportResult> {
    try {
      const data = await this.getFeesTaxesData(filters);

      const reportData: ReportData = {
        summary: {
          totalAmount: data.reduce((sum, item) => sum + (item.amount || 0), 0),
          totalCount: data.length,
          dateRange: { from: filters.startDate, to: filters.endDate }
        },
        records: data.map(item => ({
          id: item.id || item._id || 'غير محدد',
          type: item.type || 'غير محدد',
          description: item.description || 'غير محدد',
          amount: item.amount || 0,
          orderId: item.orderId || 'غير محدد',
          createdAt: item.createdAt || 'غير محدد'
        }))
      };

      return await this.generateExport('fees-taxes-report', reportData, options);
    } catch (error) {
      throw new Error(`فشل في تصدير تقرير الرسوم والضرائب: ${error}`);
    }
  }

  /**
   * تصدير تقرير المرتجعات
   */
  static async exportRefundsReport(
    filters: {
      startDate: Date;
      endDate: Date;
      status?: string;
    },
    options: ExportOptions = { format: 'csv' }
  ): Promise<ExportResult> {
    try {
      const refunds = await this.getRefundsData(filters);

      const reportData: ReportData = {
        summary: {
          totalAmount: refunds.reduce((sum, refund) => sum + (refund.amount || 0), 0),
          totalCount: refunds.length,
          dateRange: { from: filters.startDate, to: filters.endDate }
        },
        records: refunds.map(refund => ({
          refundId: refund.id || refund._id || 'غير محدد',
          orderId: refund.orderId || 'غير محدد',
          customerName: refund.customerName || 'غير محدد',
          amount: refund.amount || 0,
          reason: refund.reason || 'غير محدد',
          status: refund.status || 'غير محدد',
          createdAt: refund.createdAt || 'غير محدد',
          processedAt: refund.processedAt || 'غير محدد'
        }))
      };

      return await this.generateExport('refunds-report', reportData, options);
    } catch (error) {
      throw new Error(`فشل في تصدير تقرير المرتجعات: ${error}`);
    }
  }

  /**
   * جلب بيانات المبيعات
   */
  private static async getSalesData(filters: {
    startDate: Date;
    endDate: Date;
    storeId?: string;
    status?: string;
  }) {
    const match: any = {
      createdAt: {
        $gte: filters.startDate,
        $lte: filters.endDate
      }
    };

    if (filters.storeId) {
      match.storeId = filters.storeId;
    }

    if (filters.status) {
      match.status = filters.status;
    }

    return await DeliveryOrder.find(match)
      .populate('storeId', 'name phone')
      .populate('driverId', 'fullName phone')
      .populate('customerId', 'fullName phone')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * جلب بيانات المدفوعات
   */
  private static async getPayoutsData(filters: {
    startDate: Date;
    endDate: Date;
    status?: string;
  }) {
    const match: any = {
      createdAt: {
        $gte: filters.startDate,
        $lte: filters.endDate
      }
    };

    if (filters.status) {
      match.status = filters.status;
    }

    return await PayoutItem.find(match)
      .populate('batch_id')
      .populate('account_id', 'owner_type owner_id')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * جلب بيانات الطلبات
   */
  private static async getOrdersData(filters: {
    startDate: Date;
    endDate: Date;
    status?: string;
    storeId?: string;
  }) {
    const match: any = {
      createdAt: {
        $gte: filters.startDate,
        $lte: filters.endDate
      }
    };

    if (filters.status) {
      match.status = filters.status;
    }

    if (filters.storeId) {
      match.storeId = filters.storeId;
    }

    return await DeliveryOrder.find(match)
      .populate('storeId', 'name phone')
      .populate('driverId', 'fullName phone')
      .populate('customerId', 'fullName phone')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * جلب بيانات الرسوم والضرائب
   */
  private static async getFeesTaxesData(filters: {
    startDate: Date;
    endDate: Date;
    type?: 'fees' | 'taxes' | 'both';
  }) {
    // هذه دالة وهمية - يجب استبدالها بالمنطق الفعلي لجلب الرسوم والضرائب
    return [];
  }

  /**
   * جلب بيانات المرتجعات
   */
  private static async getRefundsData(filters: {
    startDate: Date;
    endDate: Date;
    status?: string;
  }) {
    // هذه دالة وهمية - يجب استبدالها بالمنطق الفعلي لجلب المرتجعات
    return [];
  }

  /**
   * توليد الملف المصدر مع دعم الملفات الكبيرة
   */
  private static async generateExport(
    reportType: string,
    reportData: ReportData,
    options: ExportOptions
  ): Promise<ExportResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportType}-${timestamp}.${options.format}`;

    // التحقق من حجم البيانات لتحديد طريقة التصدير المناسبة
    if (reportData.records.length > 20000) {
      return this.generateLargeFileExport(reportType, reportData, options, filename);
    }

    if (options.format === 'csv') {
      return this.generateCSVExport(reportType, reportData, options, filename);
    } else {
      return this.generateExcelExport(reportType, reportData, options, filename);
    }
  }

  /**
   * توليد ملف CSV
   */
  private static generateCSVExport(
    reportType: string,
    reportData: ReportData,
    options: ExportOptions,
    filename: string
  ): ExportResult {
    const headers = Object.keys(reportData.records[0] || {});
    const csvHeaders = headers.map(header => `"${header}"`).join(',');

    const csvRows = [
      csvHeaders,
      ...reportData.records.map(record =>
        headers.map(header => {
          const value = record[header];
          if (value === null || value === undefined || value === '') {
            return 'غير محدد';
          }
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(',')
      )
    ];

    const content = csvRows.join('\n');

    return {
      filename,
      content,
      mimeType: 'text/csv; charset=utf-8',
      size: Buffer.byteLength(content, 'utf8'),
      generatedAt: new Date(),
      dataSummary: {
        totalRecords: reportData.records.length,
        dateRange: reportData.summary.dateRange,
        totals: {
          totalAmount: reportData.summary.totalAmount,
          totalCount: reportData.summary.totalCount
        }
      }
    };
  }

  /**
   * توليد ملف Excel
   */
  private static generateExcelExport(
    reportType: string,
    reportData: ReportData,
    options: ExportOptions,
    filename: string
  ): ExportResult {
    // هذه دالة وهمية - يمكن استخدام مكتبة مثل xlsx لتوليد Excel فعليًا
    const content = JSON.stringify(reportData, null, 2);

    return {
      filename: filename.replace('.csv', '.xlsx'),
      content: Buffer.from(content),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: Buffer.byteLength(content),
      generatedAt: new Date(),
      dataSummary: {
        totalRecords: reportData.records.length,
        dateRange: reportData.summary.dateRange,
        totals: {
          totalAmount: reportData.summary.totalAmount,
          totalCount: reportData.summary.totalCount
        }
      }
    };
  }

  /**
   * توليد الملفات الكبيرة بطريقة محسنة (Chunking)
   */
  private static generateLargeFileExport(
    reportType: string,
    reportData: ReportData,
    options: ExportOptions,
    filename: string
  ): ExportResult {
    const chunkSize = 5000; // معالجة البيانات في دفعات صغيرة
    const totalRecords = reportData.records.length;

    // توليد المحتوى في دفعات لتجنب مشاكل الذاكرة
    const processChunk = (records: any[], start: number, end: number): string => {
      const chunk = records.slice(start, end);
      const headers = Object.keys(records[0] || {});

      if (start === 0) {
        // السطر الأول: العناوين
        return headers.map(header => `"${header}"`).join(',');
      }

      // السطور التالية: البيانات
      return chunk.map(record =>
        headers.map(header => {
          const value = record[header];
          if (value === null || value === undefined || value === '') {
            return 'غير محدد';
          }
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(',')
      ).join('\n');
    };

    // توليد المحتوى في دفعات
    const chunks: string[] = [];
    for (let i = 0; i < totalRecords; i += chunkSize) {
      const chunk = processChunk(reportData.records, i, Math.min(i + chunkSize, totalRecords));
      chunks.push(chunk);
    }

    const content = chunks.join('\n');

    return {
      filename,
      content,
      mimeType: options.format === 'csv' ? 'text/csv; charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: Buffer.byteLength(content, 'utf8'),
      generatedAt: new Date(),
      dataSummary: {
        totalRecords: reportData.records.length,
        dateRange: reportData.summary.dateRange,
        totals: {
          totalAmount: reportData.summary.totalAmount,
          totalCount: reportData.summary.totalCount
        }
      }
    };
  }

  /**
   * إضافة روابط قابلة للنقر في ملفات CSV
   */
  static addClickableLinks(csvContent: string, baseUrl: string): string {
    const lines = csvContent.split('\n');
    if (lines.length === 0) return csvContent;

    const headers = lines[0].split(',');
    const orderIdIndex = headers.findIndex(header => header.toLowerCase().includes('orderid') || header.toLowerCase().includes('order_id'));

    if (orderIdIndex === -1) return csvContent;

    // إضافة تعليق في أعلى الملف يوضح الروابط
    const comment = `# لعرض تفاصيل الطلب، انسخ معرف الطلب وألصقه في المتصفح: ${baseUrl}/orders/{orderId}`;
    lines.unshift(comment);

    return lines.join('\n');
  }

  /**
   * ضمان ترميز UTF-8 للنصوص العربية
   */
  static ensureUTF8Encoding(content: string): Buffer {
    // إضافة BOM للتأكد من التعرف على الترميز كـ UTF-8 في Excel
    const BOM = '\uFEFF';
    return Buffer.from(BOM + content, 'utf8');
  }

  /**
   * توليد ملخص البيانات للمقارنة
   */
  static generateDataSummary(records: any[]): {
    totalRecords: number;
    totalAmount: number;
    dateRange: { from: Date; to: Date } | null;
    statusCounts: Record<string, number>;
  } {
    const amounts = records.map(r => r.total || r.amount || 0);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);

    const dates = records
      .map(r => r.createdAt || r.date)
      .filter(date => date)
      .map(date => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());

    const dateRange = dates.length > 0 ? {
      from: dates[0],
      to: dates[dates.length - 1]
    } : null;

    const statusCounts: Record<string, number> = {};
    records.forEach(record => {
      const status = record.status;
      if (status) {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });

    return {
      totalRecords: records.length,
      totalAmount,
      dateRange,
      statusCounts
    };
  }

  /**
   * تصدير الملفات الكبيرة جداً باستخدام Streaming
   */
  static async exportLargeFileStream(
    reportType: string,
    dataGenerator: AsyncGenerator<any[], void, unknown>,
    options: ExportOptions = { format: 'csv' }
  ): Promise<ExportResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportType}-${timestamp}.${options.format}`;

    if (options.format === 'csv') {
      return this.generateLargeCSVStream(dataGenerator, options, filename);
    } else {
      return this.generateLargeExcelStream(dataGenerator, options, filename);
    }
  }

  /**
   * توليد CSV كبير باستخدام Streaming
   */
  private static async generateLargeCSVStream(
    dataGenerator: AsyncGenerator<any[], void, unknown>,
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    const chunks: string[] = [];
    let totalRecords = 0;
    let headers: string[] = [];

    // معالجة البيانات في دفعات
    for await (const batch of dataGenerator) {
      if (totalRecords === 0) {
        // استخراج العناوين من أول دفعة
        headers = Object.keys(batch[0] || {});
        chunks.push(headers.map(header => `"${header}"`).join(','));
      }

      // إضافة دفعة البيانات
      const batchContent = batch.map(record =>
        headers.map(header => {
          const value = record[header];
          if (value === null || value === undefined || value === '') {
            return 'غير محدد';
          }
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(',')
      ).join('\n');

      chunks.push(batchContent);
      totalRecords += batch.length;
    }

    const content = chunks.join('\n');

    return {
      filename,
      content,
      mimeType: 'text/csv; charset=utf-8',
      size: Buffer.byteLength(content, 'utf8'),
      generatedAt: new Date(),
      dataSummary: {
        totalRecords,
        dateRange: null, // سيتم حسابها من الخارج إذا لزم الأمر
        totals: {
          totalAmount: 0, // سيتم حسابها من الخارج إذا لزم الأمر
          totalCount: totalRecords
        }
      }
    };
  }

  /**
   * توليد Excel كبير باستخدام Streaming
   */
  private static async generateLargeExcelStream(
    dataGenerator: AsyncGenerator<any[], void, unknown>,
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    // للملفات الكبيرة جداً، نستخدم نفس منطق CSV ثم نحوله إلى Excel
    // هذا يتطلب مكتبة مثل xlsx للمعالجة الفعلية

    const csvResult = await this.generateLargeCSVStream(dataGenerator, options, filename);

    // هنا يمكن إضافة منطق تحويل CSV إلى Excel باستخدام مكتبة مثل xlsx
    // للآن سنعيد نفس محتوى CSV كـ Excel مؤقتاً

    return {
      filename: filename.replace('.csv', '.xlsx'),
      content: csvResult.content, // يجب استبدال هذا بمحتوى Excel فعلي
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: csvResult.size,
      generatedAt: new Date(),
      dataSummary: csvResult.dataSummary
    };
  }

  /**
   * إنشاء مولد بيانات للتصدير الكبير
   */
  static createDataGenerator(
    dataFetcher: (offset: number, limit: number) => Promise<any[]>,
    batchSize: number = 1000
  ): AsyncGenerator<any[], void, unknown> {
    return (async function* () {
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const batch = await dataFetcher(offset, batchSize);

        if (batch.length === 0) {
          hasMore = false;
        } else {
          yield batch;
          offset += batch.length;
        }
      }
    })();
  }

  /**
   * تقدير حجم الملف قبل التصدير
   */
  static estimateFileSize(records: any[], format: 'csv' | 'excel'): number {
    if (records.length === 0) return 0;

    const sampleRecord = records[0];
    const headers = Object.keys(sampleRecord);
    const avgRecordSize = headers.reduce((sum, header) => {
      const value = String(sampleRecord[header] || '');
      return sum + value.length;
    }, 0) / headers.length;

    const totalRecordsSize = records.length * avgRecordSize;
    const headersSize = headers.join(',').length;
    const csvOverhead = records.length * 2; // للفواصل والسطور الجديدة

    const baseSize = headersSize + totalRecordsSize + csvOverhead;

    // إضافة تقدير إضافي للتنسيق العربي وUTF-8
    const estimatedSize = Math.ceil(baseSize * 1.3);

    return format === 'csv' ? estimatedSize : Math.ceil(estimatedSize * 1.5);
  }
}

export default FinanceExportService;
