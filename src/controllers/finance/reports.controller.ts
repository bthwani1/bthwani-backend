import { Request, Response } from 'express';
import FinanceExportService from '../../services/finance/export.service';
import { ERR } from '../../utils/errors';

/**
 * Controller للتقارير المالية الموحدة
 * يضمن مطابقة الأرقام بين الشاشات والملفات المصدرة
 */

/**
 * تصدير تقرير المبيعات
 * GET /finance/reports/sales/export
 */
export const exportSalesReport = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      storeId,
      status,
      format = 'csv'
    } = req.query;

    if (!startDate || !endDate) {
          const error = ERR.VALIDATION_FAILED({
        missingFields: ['startDate', 'endDate'],
        message: 'تاريخ البداية وتاريخ النهاية مطلوبان'
      });
       res.status(error.status).json({
        error: {
          code: error.code,
          message: error.userMessage,
          suggestedAction: error.suggestedAction
        }
      });
      return;
    }

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      storeId: storeId as string,
      status: status as string
    };

    const options = {
      format: format as 'csv' | 'excel',
      timezone: 'Asia/Riyadh',
      includeHeaders: true
    };

    const exportResult = await FinanceExportService.exportSalesReport(filters, options);

    // إضافة روابط قابلة للنقر إذا كان الملف CSV
    let content = exportResult.content;
    if (format === 'csv') {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      content = FinanceExportService.addClickableLinks(content as string, baseUrl);

      // ضمان ترميز UTF-8 للنصوص العربية
      const bufferContent = FinanceExportService.ensureUTF8Encoding(content as string);
      exportResult.content = bufferContent;
      exportResult.mimeType = 'text/csv; charset=utf-8';
    }

    // إعداد رؤوس الاستجابة
    res.setHeader('Content-Type', exportResult.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('Content-Length', exportResult.size);
    res.setHeader('X-Data-Summary', JSON.stringify(exportResult.dataSummary));

    // إرسال الملف
    if (Buffer.isBuffer(exportResult.content)) {
      res.send(exportResult.content);
    } else {
      res.send(exportResult.content);
    }

  } catch (error: any) {
    console.error('خطأ في تصدير تقرير المبيعات:', error);
    const appError = ERR.INTERNAL({
      operation: 'تصدير تقرير المبيعات',
      originalError: error.message
    });
    res.status(appError.status).json({
      error: {
        code: appError.code,
        message: appError.userMessage,
        suggestedAction: appError.suggestedAction
      }
    });
  }
};

/**
 * تصدير تقرير المدفوعات
 * GET /finance/reports/payouts/export
 */
export const exportPayoutsReport = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      status,
      format = 'csv'
    } = req.query;

    if (!startDate || !endDate) {
       res.status(400).json({
        message: 'تاريخ البداية وتاريخ النهاية مطلوبان'
      });
      return;
    }

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      status: status as string
    };

    const options = {
      format: format as 'csv' | 'excel',
      timezone: 'Asia/Riyadh',
      includeHeaders: true
    };

    const exportResult = await FinanceExportService.exportPayoutsReport(filters, options);

    // إضافة روابط قابلة للنقر إذا كان الملف CSV
    let content = exportResult.content;
    if (format === 'csv') {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      content = FinanceExportService.addClickableLinks(content as string, baseUrl);

      // ضمان ترميز UTF-8 للنصوص العربية
      const bufferContent = FinanceExportService.ensureUTF8Encoding(content as string);
      exportResult.content = bufferContent;
      exportResult.mimeType = 'text/csv; charset=utf-8';
    }

    // إعداد رؤوس الاستجابة
    res.setHeader('Content-Type', exportResult.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('Content-Length', exportResult.size);
    res.setHeader('X-Data-Summary', JSON.stringify(exportResult.dataSummary));

    // إرسال الملف
    if (Buffer.isBuffer(exportResult.content)) {
      res.send(exportResult.content);
    } else {
      res.send(exportResult.content);
    }

  } catch (error: any) {
    console.error('خطأ في تصدير تقرير المدفوعات:', error);
    res.status(500).json({
      message: error.message || 'فشل في تصدير تقرير المدفوعات'
    });
  }
};

/**
 * تصدير تقرير الطلبات
 * GET /finance/reports/orders/export
 */
export const exportOrdersReport = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      status,
      storeId,
      format = 'csv'
    } = req.query;

    if (!startDate || !endDate) {
         res.status(400).json({
        message: 'تاريخ البداية وتاريخ النهاية مطلوبان'
      });
      return;
    }

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      status: status as string,
      storeId: storeId as string
    };

    const options = {
      format: format as 'csv' | 'excel',
      timezone: 'Asia/Riyadh',
      includeHeaders: true
    };

    const exportResult = await FinanceExportService.exportOrdersReport(filters, options);

    // إضافة روابط قابلة للنقر إذا كان الملف CSV
    let content = exportResult.content;
    if (format === 'csv') {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      content = FinanceExportService.addClickableLinks(content as string, baseUrl);

      // ضمان ترميز UTF-8 للنصوص العربية
      const bufferContent = FinanceExportService.ensureUTF8Encoding(content as string);
      exportResult.content = bufferContent;
      exportResult.mimeType = 'text/csv; charset=utf-8';
    }

    // إعداد رؤوس الاستجابة
    res.setHeader('Content-Type', exportResult.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('Content-Length', exportResult.size);
    res.setHeader('X-Data-Summary', JSON.stringify(exportResult.dataSummary));

    // إرسال الملف
    if (Buffer.isBuffer(exportResult.content)) {
      res.send(exportResult.content);
    } else {
      res.send(exportResult.content);
    }

  } catch (error: any) {
    console.error('خطأ في تصدير تقرير الطلبات:', error);
    res.status(500).json({
      message: error.message || 'فشل في تصدير تقرير الطلبات'
    });
  }
};

/**
 * تصدير تقرير الرسوم والضرائب
 * GET /finance/reports/fees-taxes/export
 */
export const exportFeesTaxesReport = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      type = 'both',
      format = 'csv'
    } = req.query;

    if (!startDate || !endDate) {
       res.status(400).json({
        message: 'تاريخ البداية وتاريخ النهاية مطلوبان'
      });
      return;
    }

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      type: type as 'fees' | 'taxes' | 'both'
    };

    const options = {
      format: format as 'csv' | 'excel',
      timezone: 'Asia/Riyadh',
      includeHeaders: true
    };

    const exportResult = await FinanceExportService.exportFeesTaxesReport(filters, options);

    // إضافة روابط قابلة للنقر إذا كان الملف CSV
    let content = exportResult.content;
    if (format === 'csv') {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      content = FinanceExportService.addClickableLinks(content as string, baseUrl);

      // ضمان ترميز UTF-8 للنصوص العربية
      const bufferContent = FinanceExportService.ensureUTF8Encoding(content as string);
      exportResult.content = bufferContent;
      exportResult.mimeType = 'text/csv; charset=utf-8';
    }

    // إعداد رؤوس الاستجابة
    res.setHeader('Content-Type', exportResult.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('Content-Length', exportResult.size);
    res.setHeader('X-Data-Summary', JSON.stringify(exportResult.dataSummary));

    // إرسال الملف
    if (Buffer.isBuffer(exportResult.content)) {
      res.send(exportResult.content);
    } else {
      res.send(exportResult.content);
    }

  } catch (error: any) {
    console.error('خطأ في تصدير تقرير الرسوم والضرائب:', error);
    res.status(500).json({
      message: error.message || 'فشل في تصدير تقرير الرسوم والضرائب'
    });
  }
};

/**
 * تصدير تقرير المرتجعات
 * GET /finance/reports/refunds/export
 */
export const exportRefundsReport = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      status,
      format = 'csv'
    } = req.query;

    if (!startDate || !endDate) {
       res.status(400).json({
        message: 'تاريخ البداية وتاريخ النهاية مطلوبان'
      });
      return;
      }

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      status: status as string
    };

    const options = {
      format: format as 'csv' | 'excel',
      timezone: 'Asia/Riyadh',
      includeHeaders: true
    };

    const exportResult = await FinanceExportService.exportRefundsReport(filters, options);

    // إضافة روابط قابلة للنقر إذا كان الملف CSV
    let content = exportResult.content;
    if (format === 'csv') {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      content = FinanceExportService.addClickableLinks(content as string, baseUrl);

      // ضمان ترميز UTF-8 للنصوص العربية
      const bufferContent = FinanceExportService.ensureUTF8Encoding(content as string);
      exportResult.content = bufferContent;
      exportResult.mimeType = 'text/csv; charset=utf-8';
    }

    // إعداد رؤوس الاستجابة
    res.setHeader('Content-Type', exportResult.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('Content-Length', exportResult.size);
    res.setHeader('X-Data-Summary', JSON.stringify(exportResult.dataSummary));

    // إرسال الملف
    if (Buffer.isBuffer(exportResult.content)) {
      res.send(exportResult.content);
    } else {
      res.send(exportResult.content);
    }

  } catch (error: any) {
    console.error('خطأ في تصدير تقرير المرتجعات:', error);
    res.status(500).json({
      message: error.message || 'فشل في تصدير تقرير المرتجعات'
    });
  }
};

/**
 * جلب ملخص البيانات للمقارنة مع الشاشات
 * GET /finance/reports/data-summary
 */
export const getDataSummary = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      reportType = 'orders',
      storeId,
      status
    } = req.query;

    if (!startDate || !endDate) {
       res.status(400).json({
        message: 'تاريخ البداية وتاريخ النهاية مطلوبان'
      });
      return;
    }

    let summary;
    switch (reportType) {
      case 'sales':
        summary = await FinanceExportService.generateDataSummary(
          await FinanceExportService['getSalesData']({
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string),
            storeId: storeId as string,
            status: status as string
          })
        );
        break;

      case 'payouts':
        summary = await FinanceExportService.generateDataSummary(
          await FinanceExportService['getPayoutsData']({
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string),
            status: status as string
          })
        );
        break;

      case 'orders':
        summary = await FinanceExportService.generateDataSummary(
          await FinanceExportService['getOrdersData']({
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string),
            storeId: storeId as string,
            status: status as string
          })
        );
        break;

      default:
         res.status(400).json({
          message: 'نوع التقرير غير مدعوم'
        });
        return;
    }

    res.json({
      message: 'ملخص البيانات تم جلبه بنجاح',
      summary,
      reportType,
      filters: {
        startDate,
        endDate,
        storeId,
        status
      }
    });

  } catch (error: any) {
    console.error('خطأ في جلب ملخص البيانات:', error);
    res.status(500).json({
      message: error.message || 'فشل في جلب ملخص البيانات'
    });
  }
};

/**
 * فحص مطابقة البيانات بين الشاشة والملف المصدر
 * POST /finance/reports/validate-consistency
 */
export const validateDataConsistency = async (req: Request, res: Response) => {
  try {
    const {
      reportType,
      startDate,
      endDate,
      uiTotal,
      uiCount,
      storeId,
      status
    } = req.body;

    if (!reportType || !startDate || !endDate || uiTotal === undefined || uiCount === undefined) {
       res.status(400).json({
        message: 'جميع الحقول مطلوبة لفحص المطابقة'
      });
      return;
    }

    let exportResult;
    switch (reportType) {
      case 'sales':
        exportResult = await FinanceExportService.exportSalesReport({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          storeId,
          status
        }, { format: 'csv' });
        break;

      case 'payouts':
        exportResult = await FinanceExportService.exportPayoutsReport({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status
        }, { format: 'csv' });
        break;

      case 'orders':
        exportResult = await FinanceExportService.exportOrdersReport({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          storeId,
          status
        }, { format: 'csv' });
        break;

      default:
         res.status(400).json({
          message: 'نوع التقرير غير مدعوم'
        });
        return;
    }

    const fileTotal = exportResult.dataSummary.totals.totalAmount;
    const fileCount = exportResult.dataSummary.totalRecords;

    const totalMatch = Math.abs(fileTotal - uiTotal) < 0.01; // نسماح بفرق 0.01 ريال
    const countMatch = fileCount === uiCount;

    res.json({
      message: 'تم فحص المطابقة بنجاح',
      consistency: {
        totalMatch,
        countMatch,
        fileTotal,
        uiTotal,
        fileCount,
        uiCount,
        totalDifference: fileTotal - uiTotal,
        countDifference: fileCount - uiCount
      },
      reportType,
      exportResult: {
        filename: exportResult.filename,
        generatedAt: exportResult.generatedAt,
        size: exportResult.size
      }
    });

  } catch (error: any) {
    console.error('خطأ في فحص المطابقة:', error);
    res.status(500).json({
      message: error.message || 'فشل في فحص المطابقة'
    });
  }
};
