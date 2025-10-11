import { Router, Request, Response } from "express";
import { AdminLog } from "../../models/admin/adminLog.model";
import { requirePermission } from "../../middleware/rbac";

const router = Router();

// GET /admin/audit-logs - قراءة سجل التدقيق مع فلاتر
router.get("/audit-logs", requirePermission('admin.audit', 'read'), async (req: Request, res: Response) => {
  try {
    const {
      q,
      actorId,
      action,
      dateFrom,
      dateTo,
      limit = 50,
      page = 1,
      actorType,
      status,
      method
    } = req.query;

    // بناء فلتر البحث
    const filter: any = {};

    // فلتر النص الحر
    if (q) {
      filter.$or = [
        { action: { $regex: q, $options: 'i' } },
        { details: { $regex: q, $options: 'i' } }
      ];
    }

    // فلتر المستخدم
    if (actorId) {
      filter.actorId = actorId;
    }

    // فلتر الإجراء
    if (action) {
      filter.action = { $regex: action, $options: 'i' };
    }

    // فلتر التاريخ
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo as string);
    }

    // فلتر نوع المنفذ
    if (actorType) {
      filter.actorType = actorType;
    }

    // فلتر الحالة
    if (status) {
      filter.status = status;
    }

    // فلتر الطريقة
    if (method) {
      filter.method = method;
    }

    // حساب الصفحة والحد الأقصى
    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Math.min(Number(limit), 100); // حد أقصى 100

    // تنفيذ الاستعلام مع الفرز والتصفح
    const logs = await AdminLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('actorId', 'name email')
      .lean();

    // حساب العدد الإجمالي
    const total = await AdminLog.countDocuments(filter);

    // إرجاع النتائج
    res.json({
      logs,
      pagination: {
        page: Number(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch audit logs'
      }
    });
  }
});

// GET /admin/audit-logs/my-actions - آخر إجراءاتي
router.get("/audit-logs/my-actions", requirePermission('admin.audit', 'read'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).admin || (req as any).vendor || (req as any).user;
    const limit = Math.min(Number(req.query.limit) || 3, 10);

    const logs = await AdminLog.find({
      actorId: actor?._id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // آخر 30 يوم
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ logs });

  } catch (error: any) {
    console.error('Error fetching my actions:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch recent actions'
      }
    });
  }
});

// GET /admin/audit-logs/stats - إحصائيات سجل التدقيق
router.get("/audit-logs/stats", requirePermission('admin.audit', 'read'), async (req: Request, res: Response) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalLogs,
      logs24h,
      logs7d,
      logs30d,
      actionStats,
      actorTypeStats
    ] = await Promise.all([
      AdminLog.countDocuments(),
      AdminLog.countDocuments({ createdAt: { $gte: last24h } }),
      AdminLog.countDocuments({ createdAt: { $gte: last7d } }),
      AdminLog.countDocuments({ createdAt: { $gte: last30d } }),
      AdminLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      AdminLog.aggregate([
        { $group: { _id: '$actorType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      total: totalLogs,
      last24h: logs24h,
      last7d: logs7d,
      last30d: logs30d,
      topActions: actionStats,
      actorTypeDistribution: actorTypeStats
    });

  } catch (error: any) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch audit statistics'
      }
    });
  }
});

export default router;
