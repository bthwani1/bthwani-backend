import FinanceExportService from '../export.service';
import { Types } from 'mongoose';

// Mock البيانات للاختبار
const mockOrdersData = [
  {
    id: 'ORD-001',
    createdAt: new Date('2025-01-15T10:30:00.000Z'),
    customerName: 'أحمد محمد',
    storeName: 'مطعم الرياض',
    items: 3,
    subtotal: 100,
    deliveryFee: 15,
    taxes: 5,
    total: 120,
    status: 'delivered',
    paymentMethod: 'كاش'
  },
  {
    id: 'ORD-002',
    createdAt: new Date('2025-01-15T11:00:00.000Z'),
    customerName: 'فاطمة علي',
    storeName: 'سوبر ماركت',
    items: 2,
    subtotal: 50,
    deliveryFee: 10,
    taxes: 3,
    total: 63,
    status: 'delivered',
    paymentMethod: 'بطاقة ائتمان'
  }
];

const mockPayoutsData = [
  {
    id: 'PO-001',
    driverId: 'DRV-001',
    driverName: 'محمد السائق',
    amount: 150,
    fees: 5,
    netAmount: 145,
    status: 'processed',
    createdAt: new Date('2025-01-15T09:00:00.000Z'),
    processedAt: new Date('2025-01-15T09:30:00.000Z'),
    bankRef: 'BNK-12345'
  }
];

describe('FinanceExportService', () => {
  describe('generateDataSummary', () => {
    it('يجب أن يحسب ملخص البيانات بشكل صحيح', () => {
      const summary = FinanceExportService.generateDataSummary(mockOrdersData);

      expect(summary.totalRecords).toBe(2);
      expect(summary.totalAmount).toBe(183); // 120 + 63
      expect(summary.statusCounts.delivered).toBe(2);
      expect(summary.dateRange).toBeTruthy();
      expect(summary.dateRange?.from).toEqual(new Date('2025-01-15T10:30:00.000Z'));
      expect(summary.dateRange?.to).toEqual(new Date('2025-01-15T11:00:00.000Z'));
    });

    it('يجب أن يتعامل مع البيانات الفارغة', () => {
      const summary = FinanceExportService.generateDataSummary([]);

      expect(summary.totalRecords).toBe(0);
      expect(summary.totalAmount).toBe(0);
      expect(summary.dateRange).toBeNull();
    });
  });

  describe('exportSalesReport', () => {
    it('يجب أن يصدر تقرير المبيعات بنجاح', async () => {
      // Mock دالة getSalesData
      jest.spyOn(FinanceExportService as any, 'getSalesData')
        .mockResolvedValue(mockOrdersData);

      const result = await FinanceExportService.exportSalesReport({
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-15')
      });

      expect(result.filename).toContain('sales-report');
      expect(result.content).toContain('ORD-001');
      expect(result.content).toContain('ORD-002');
      expect(result.dataSummary.totalRecords).toBe(2);
      expect(result.dataSummary.totals.totalAmount).toBe(183);
    });
  });

  describe('exportPayoutsReport', () => {
    it('يجب أن يصدر تقرير المدفوعات بنجاح', async () => {
      // Mock دالة getPayoutsData
      jest.spyOn(FinanceExportService as any, 'getPayoutsData')
        .mockResolvedValue(mockPayoutsData);

      const result = await FinanceExportService.exportPayoutsReport({
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-15')
      });

      expect(result.filename).toContain('payouts-report');
      expect(result.content).toContain('PO-001');
      expect(result.content).toContain('محمد السائق');
      expect(result.dataSummary.totalRecords).toBe(1);
      expect(result.dataSummary.totals.totalAmount).toBe(150);
    });
  });

  describe('addClickableLinks', () => {
    it('يجب أن يضيف روابط قابلة للنقر في ملف CSV', () => {
      const csvContent = `orderId,date,total\nORD-001,2025-01-15,120\nORD-002,2025-01-15,63`;
      const baseUrl = 'https://example.com';

      const result = FinanceExportService.addClickableLinks(csvContent, baseUrl);

      expect(result).toContain('# لعرض تفاصيل الطلب');
      expect(result).toContain('https://example.com/orders/ORD-001');
    });

    it('يجب أن يتعامل مع ملفات CSV بدون معرف طلب', () => {
      const csvContent = `date,total\n2025-01-15,120\n2025-01-15,63`;
      const baseUrl = 'https://example.com';

      const result = FinanceExportService.addClickableLinks(csvContent, baseUrl);

      expect(result).toBe(csvContent); // يجب أن يعيد نفس المحتوى بدون تغيير
    });
  });

  describe('ensureUTF8Encoding', () => {
    it('يجب أن يضيف BOM للترميز UTF-8', () => {
      const content = 'test content';
      const buffer = FinanceExportService.ensureUTF8Encoding(content);

      expect(buffer.length).toBeGreaterThan(content.length);
      expect(buffer[0]).toBe(0xEF); // BOM UTF-8
      expect(buffer[1]).toBe(0xBB);
      expect(buffer[2]).toBe(0xBF);
    });
  });

  describe('estimateFileSize', () => {
    it('يجب أن يقدر حجم الملف بدقة معقولة', () => {
      const size = FinanceExportService.estimateFileSize(mockOrdersData, 'csv');

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('يجب أن يعيد صفر لحجم البيانات الفارغة', () => {
      const size = FinanceExportService.estimateFileSize([], 'csv');

      expect(size).toBe(0);
    });
  });

  describe('Large File Export', () => {
    it('يجب أن يستخدم تصدير الملفات الكبيرة للبيانات الكبيرة', async () => {
      // إنشاء بيانات كبيرة للاختبار
      const largeData = Array.from({ length: 25000 }, (_, i) => ({
        id: `ORD-${i.toString().padStart(5, '0')}`,
        createdAt: new Date(),
        customerName: `عميل ${i}`,
        storeName: `متجر ${i}`,
        items: Math.floor(Math.random() * 10) + 1,
        subtotal: Math.floor(Math.random() * 1000),
        deliveryFee: Math.floor(Math.random() * 50),
        taxes: Math.floor(Math.random() * 20),
        total: Math.floor(Math.random() * 1000) + 50,
        status: 'delivered',
        paymentMethod: 'كاش'
      }));

      jest.spyOn(FinanceExportService as any, 'getSalesData')
        .mockResolvedValue(largeData);

      const result = await FinanceExportService.exportSalesReport({
        startDate: new Date(),
        endDate: new Date()
      });

      expect(result.dataSummary.totalRecords).toBe(25000);
      expect(result.content.split('\n').length).toBeGreaterThan(25000);
    });
  });

  describe('CSV Format Validation', () => {
    it('يجب أن يولد CSV بتنسيق صحيح', async () => {
      jest.spyOn(FinanceExportService as any, 'getSalesData')
        .mockResolvedValue(mockOrdersData);

      const result = await FinanceExportService.exportSalesReport({
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-15')
      });

      const lines = result.content.split('\n');
      expect(lines.length).toBe(3); // عناوين + سطرين من البيانات

      // التحقق من العناوين
      const headers = lines[0].split(',');
      expect(headers).toContain('"orderId"');
      expect(headers).toContain('"date"');
      expect(headers).toContain('"total"');

      // التحقق من البيانات
      expect(lines[1]).toContain('ORD-001');
      expect(lines[2]).toContain('ORD-002');
    });

    it('يجب أن يتعامل مع النصوص التي تحتوي على فواصل', async () => {
      const dataWithCommas = [{
        id: 'ORD-001',
        description: 'طلب, يحتوي على فاصلة',
        total: 100
      }];

      jest.spyOn(FinanceExportService as any, 'getSalesData')
        .mockResolvedValue(dataWithCommas);

      const result = await FinanceExportService.exportSalesReport({
        startDate: new Date(),
        endDate: new Date()
      });

      // يجب أن تكون النصوص التي تحتوي على فواصل محاطة بعلامات تنصيص
      expect(result.content).toContain('"طلب, يحتوي على فاصلة"');
    });
  });

  describe('Error Handling', () => {
    it('يجب أن يرمي خطأ للبيانات غير الصالحة', async () => {
      jest.spyOn(FinanceExportService as any, 'getSalesData')
        .mockRejectedValue(new Error('فشل في جلب البيانات'));

      await expect(FinanceExportService.exportSalesReport({
        startDate: new Date(),
        endDate: new Date()
      })).rejects.toThrow('فشل في تصدير تقرير المبيعات');
    });
  });
});

// اختبار الأداء للملفات الكبيرة
describe('Performance Tests', () => {
  it('يجب أن يتعامل مع تصدير 50,000 سجل في وقت معقول', async () => {
    const largeData = Array.from({ length: 50000 }, (_, i) => ({
      id: `ORD-${i.toString().padStart(6, '0')}`,
      createdAt: new Date(),
      customerName: `عميل ${i}`,
      storeName: `متجر ${i}`,
      items: Math.floor(Math.random() * 10) + 1,
      subtotal: Math.floor(Math.random() * 1000),
      deliveryFee: Math.floor(Math.random() * 50),
      taxes: Math.floor(Math.random() * 20),
      total: Math.floor(Math.random() * 1000) + 50,
      status: 'delivered',
      paymentMethod: 'كاش'
    }));

    jest.spyOn(FinanceExportService as any, 'getSalesData')
      .mockResolvedValue(largeData);

    const startTime = Date.now();

    const result = await FinanceExportService.exportSalesReport({
      startDate: new Date(),
      endDate: new Date()
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(result.dataSummary.totalRecords).toBe(50000);
    expect(duration).toBeLessThan(10000); // يجب أن يكتمل في أقل من 10 ثوانٍ
  });
});
