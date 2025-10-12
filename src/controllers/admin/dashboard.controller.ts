// src/controllers/admin/dashboard.controller.ts
import { Request, Response } from "express";
import Order from "../../models/delivery_marketplace_v1/Order";
import { User } from "../../models/user";
import Driver from "../../models/Driver_app/driver";
import DeliveryStore from "../../models/delivery_marketplace_v1/DeliveryStore";
import driverReviewModel from "../../models/Driver_app/driverReview.model";
import SupportTicket from "../../models/support/SupportTicket";

/** مساعد: تحويل from/to + tz إلى نطاق زمني مضبوط */
function getRange(req: Request) {
  const tz = (req.query.tz as string) || "Asia/Aden";
  const fromQ = req.query.from as string | undefined;
  const toQ = req.query.to as string | undefined;
  const now = new Date();
  const from = fromQ
    ? new Date(fromQ)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate()); // بداية اليوم
  const to = toQ ? new Date(toQ) : now;
  return { from, to, tz };
}

/** حسبة GMV: سعر المنتجات + رسوم التوصيل */
const gmvExpr = { $add: ["$price", { $ifNull: ["$deliveryFee", 0] }] };

/** GET /admin/dashboard/summary */
export async function getAdminSummary(req: Request, res: Response) {
  const { from, to } = getRange(req);

  // إجمالي الطلبات + GMV + إيراد المنصة + معدّل الإلغاء + زمن التوصيل
  const [kpis, usersCount, driversCount, storesCount, statusBuckets] =
    await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $facet: {
            base: [
              {
                $group: {
                  _id: null,
                  orders: { $sum: 1 },
                  gmv: { $sum: gmvExpr },
                  revenue: { $sum: { $ifNull: ["$platformShare", 0] } },
                  deliveryFees: { $sum: { $ifNull: ["$deliveryFee", 0] } },
                },
              },
            ],
            cancelRate: [
              {
                $group: {
                  _id: "$status",
                  c: { $sum: 1 },
                },
              },
            ],
            deliveryTime: [
              {
                $match: { status: "delivered", deliveredAt: { $exists: true } },
              },
              {
                $project: {
                  deliveryMin: {
                    $divide: [
                      { $subtract: ["$deliveredAt", "$createdAt"] },
                      1000 * 60,
                    ],
                  },
                },
              },
              { $sort: { deliveryMin: 1 } },
              {
                $group: {
                  _id: null,
                  allTimes: { $push: "$deliveryMin" },
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  avgDeliveryMin: { $avg: "$allTimes" },
                  p90DeliveryMin: {
                    $arrayElemAt: [
                      "$allTimes",
                      { $floor: { $multiply: [{ $divide: [9, 10] }, "$count"] } },
                    ],
                  },
                },
              },
            ],
          },
        },
        {
          $project: {
            base: { $arrayElemAt: ["$base", 0] },
            cancelRate: "$cancelRate",
            deliveryTime: { $arrayElemAt: ["$deliveryTime", 0] },
          },
        },
      ]),
      User.countDocuments({ createdAt: { $lte: to } }),
      Driver.countDocuments({}),
      DeliveryStore.countDocuments({}),
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

  const base = kpis[0]?.base || {
    orders: 0,
    gmv: 0,
    revenue: 0,
    deliveryFees: 0,
  };
  const cancelTotal = statusBuckets.reduce(
    (acc: number, s: any) => acc + s.count,
    0
  );
  const cancelled =
    statusBuckets.find((s: any) => s._id === "cancelled")?.count || 0;
  const cancelRate = cancelTotal ? cancelled / cancelTotal : 0;

  res.json({
    range: { from, to },
    users: usersCount,
    drivers: driversCount,
    stores: storesCount,
    orders: base.orders || 0,
    gmv: base.gmv || 0,
    revenue: base.revenue || 0,
    deliveryFees: base.deliveryFees || 0,
    cancelRate,
    deliveryTime: {
      avgMin: kpis[0]?.deliveryTime?.avgDeliveryMin ?? null,
      p90Min: kpis[0]?.deliveryTime?.p90DeliveryMin ?? null,
    },
    byStatus: statusBuckets.map((s: any) => ({
      status: s._id,
      count: s.count,
    })),
  });
}

/** GET /admin/dashboard/timeseries?metric=orders|gmv|revenue&interval=hour|day */
export async function getAdminTimeseries(req: Request, res: Response) {
  const { from, to } = getRange(req);
  const metric = (req.query.metric as string) || "orders";
  const interval = (req.query.interval as string) || "day";

  const groupId =
    interval === "hour"
      ? {
          y: { $year: "$createdAt" },
          m: { $month: "$createdAt" },
          d: { $dayOfMonth: "$createdAt" },
          h: { $hour: "$createdAt" },
        }
      : {
          y: { $year: "$createdAt" },
          m: { $month: "$createdAt" },
          d: { $dayOfMonth: "$createdAt" },
        };

  const valueExpr =
    metric === "gmv"
      ? gmvExpr
      : metric === "revenue"
      ? { $ifNull: ["$platformShare", 0] }
      : 1;

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    { $group: { _id: groupId, value: { $sum: valueExpr } } },
    {
      $project: {
        _id: 0,
        date: {
          $dateFromParts: {
            year: "$_id.y",
            month: "$_id.m",
            day: "$_id.d",
            hour: interval === "hour" ? "$_id.h" : 0,
          },
        },
        value: 1,
      },
    },
    { $sort: { date: 1 } },
  ]);

  res.json({ metric, interval, from, to, data });
}

/** GET /admin/dashboard/top?by=stores|cities|categories&limit=10 */
export async function getAdminTop(req: Request, res: Response) {
  const { from, to } = getRange(req);
  const by = (req.query.by as string) || "stores";
  const limit = Math.max(
    1,
    Math.min(50, parseInt((req.query.limit as string) || "10", 10))
  );

  let groupKey: any;
  if (by === "cities") groupKey = "$address.city";
  else if (by === "categories") groupKey = "$category";
  else groupKey = "$store"; // stores (default)

  const rows = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: from, $lte: to },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: groupKey,
        orders: { $sum: 1 },
        gmv: { $sum: gmvExpr },
        revenue: { $sum: { $ifNull: ["$platformShare", 0] } },
      },
    },
    { $sort: { gmv: -1 } },
    { $limit: limit },
  ]);

  res.json({ by, from, to, rows });
}

/** GET /admin/dashboard/alerts — أرقام عاجلة */
export async function getAdminAlerts(req: Request, res: Response) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // اليوم
  const [awaitingProcurement, awaitingAssign, overdue] = await Promise.all([
    Order.countDocuments({ status: "awaiting_procurement" }),
    Order.countDocuments({ status: "placed" }),
    Order.countDocuments({
      status: "out_for_delivery",
      createdAt: { $lt: new Date(now.getTime() - 1000 * 60 * 90) },
    }), // أكثر من 90 دقيقة
  ]);
  res.json({
    todayFrom: from,
    awaitingProcurement,
    awaitingAssign,
    overdueDeliveries: overdue,
  });
}

/** GET /admin/dashboard/ratings - جلب جميع التقييمات */
import { parseListQuery } from "../../utils/query";

export async function getAllRatings(req: Request, res: Response) {
  try {
    const { page, perPage } = parseListQuery(req.query);
    const skip = (page - 1) * perPage;

    const type = (req.query.type as string) || "order"; // "order" أو "driver"
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;

    let ratings: any[] = [];
    let total: number = 0;

    if (type === "order") {
      // جلب تقييمات الطلبات
      const orderRatings = await Order.aggregate([
        {
          $match: {
            "rating": { $exists: true, $ne: null }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userInfo"
          }
        },
        {
          $lookup: {
            from: "drivers",
            localField: "driver",
            foreignField: "_id",
            as: "driverInfo"
          }
        },
        {
          $project: {
            _id: 1,
            orderId: "$_id",
            user: { $arrayElemAt: ["$userInfo", 0] },
            driver: { $arrayElemAt: ["$driverInfo", 0] },
            rating: "$rating",
            status: 1,
            createdAt: 1,
            deliveredAt: 1
          }
        },
        {
          $sort: { [sortBy]: sortOrder }
        },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: perPage }
            ],
            total: [
              { $count: "count" }
            ]
          }
        }
      ]);

      ratings = orderRatings[0]?.data || [];
      total = orderRatings[0]?.total[0]?.count || 0;

    } else if (type === "driver") {
      // جلب تقييمات السائقين للمستخدمين
      const driverRatings = await driverReviewModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userInfo"
          }
        },
        {
          $lookup: {
            from: "drivers",
            localField: "driver",
            foreignField: "_id",
            as: "driverInfo"
          }
        },
        {
          $lookup: {
            from: "deliveryorders",
            localField: "order",
            foreignField: "_id",
            as: "orderInfo"
          }
        },
        {
          $project: {
            _id: 1,
            order: 1,
            orderInfo: { $arrayElemAt: ["$orderInfo", 0] },
            user: { $arrayElemAt: ["$userInfo", 0] },
            driver: { $arrayElemAt: ["$driverInfo", 0] },
            rating: 1,
            comment: 1,
            createdAt: 1
          }
        },
        {
          $sort: { [sortBy]: sortOrder }
        },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: perPage }
            ],
            total: [
              { $count: "count" }
            ]
          }
        }
      ]);

      ratings = driverRatings[0]?.data || [];
      total = driverRatings[0]?.total[0]?.count || 0;
    }

    // جلب إحصائيات عامة
    const stats = await Order.aggregate([
      {
        $match: {
          "rating": { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgCompanyRating: { $avg: "$rating.company" },
          avgOrderRating: { $avg: "$rating.order" },
          avgDriverRating: { $avg: "$rating.driver" },
          totalRatings: { $sum: 1 },
          fiveStarCount: {
            $sum: {
              $cond: [
                { $gte: [{ $avg: ["$rating.company", "$rating.order", "$rating.driver"] }, 4.5] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const generalStats = stats[0] || {
      avgCompanyRating: 0,
      avgOrderRating: 0,
      avgDriverRating: 0,
      totalRatings: 0,
      fiveStarCount: 0
    };

    res.json({
      ratings,
      pagination: {
        page,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage)
      },
      stats: {
        averageCompanyRating: generalStats.avgCompanyRating,
        averageOrderRating: generalStats.avgOrderRating,
        averageDriverRating: generalStats.avgDriverRating,
        totalRatings: generalStats.totalRatings,
        fiveStarPercentage: generalStats.totalRatings > 0 ?
          (generalStats.fiveStarCount / generalStats.totalRatings) * 100 : 0
      }
    });

  } catch (error: any) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({
      message: "حدث خطأ في جلب التقييمات",
      error: error.message
    });
  }
}

/** GET /admin/dashboard/support-tickets - جلب جميع نقاط الدعم */
export async function getAllSupportTickets(req: Request, res: Response) {
  try {
    const { page, perPage } = parseListQuery(req.query);
    const skip = (page - 1) * perPage;

    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const assignee = req.query.assignee as string;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "updatedAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;

    // بناء فلاتر البحث
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (assignee) {
      filter.assignee = assignee;
    }

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'requester.userId': { $regex: search, $options: 'i' } }
      ];
    }

    // جلب نقاط الدعم مع معلومات المستخدمين المرتبطين
    const tickets = await SupportTicket.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "users",
          localField: "requester.userId",
          foreignField: "uid",
          as: "requesterInfo"
        }
      },
      {
        $lookup: {
          from: "deliveryorders",
          localField: "links.orderId",
          foreignField: "_id",
          as: "orderInfo"
        }
      },
      {
        $lookup: {
          from: "deliverystores",
          localField: "links.store",
          foreignField: "_id",
          as: "storeInfo"
        }
      },
      {
        $lookup: {
          from: "drivers",
          localField: "links.driver",
          foreignField: "_id",
          as: "driverInfo"
        }
      },
      {
        $project: {
          number: 1,
          subject: 1,
          description: 1,
          status: 1,
          priority: 1,
          assignee: 1,
          group: 1,
          tags: 1,
          channel: 1,
          source: 1,
          firstResponseAt: 1,
          resolvedAt: 1,
          breachFirstResponse: 1,
          breachResolve: 1,
          csatScore: 1,
          csatComment: 1,
          csatSentAt: 1,
          createdAt: 1,
          updatedAt: 1,
          requester: {
            userId: "$requester.userId",
            phone: "$requester.phone",
            email: "$requester.email",
            userInfo: { $arrayElemAt: ["$requesterInfo", 0] }
          },
          links: {
            orderId: "$links.orderId",
            store: "$links.store",
            driver: "$links.driver",
            orderInfo: { $arrayElemAt: ["$orderInfo", 0] },
            storeInfo: { $arrayElemAt: ["$storeInfo", 0] },
            driverInfo: { $arrayElemAt: ["$driverInfo", 0] }
          }
        }
      },
      {
        $sort: { [sortBy]: sortOrder }
      },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: perPage }
          ],
          total: [
            { $count: "count" }
          ]
        }
      }
    ]);

    const ticketsData = tickets[0]?.data || [];
    const total = tickets[0]?.total[0]?.count || 0;

    // جلب إحصائيات نقاط الدعم
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          newTickets: { $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] } },
          openTickets: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          pendingTickets: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          resolvedTickets: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          closedTickets: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          urgentTickets: { $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] } },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $and: ["$createdAt", "$resolvedAt"] },
                { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60 * 24] }, // أيام
                null
              ]
            }
          }
        }
      }
    ]);

    const generalStats = stats[0] || {
      totalTickets: 0,
      newTickets: 0,
      openTickets: 0,
      pendingTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
      urgentTickets: 0,
      avgResolutionTime: 0
    };

    res.json({
      tickets: ticketsData,
      pagination: {
        page,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage)
      },
      stats: {
        totalTickets: generalStats.totalTickets,
        newTickets: generalStats.newTickets,
        openTickets: generalStats.openTickets,
        pendingTickets: generalStats.pendingTickets,
        resolvedTickets: generalStats.resolvedTickets,
        closedTickets: generalStats.closedTickets,
        urgentTickets: generalStats.urgentTickets,
        avgResolutionTimeDays: generalStats.avgResolutionTime || 0,
        resolutionRate: generalStats.totalTickets > 0 ?
          (generalStats.resolvedTickets / generalStats.totalTickets) * 100 : 0
      }
    });

  } catch (error: any) {
    console.error("Error fetching support tickets:", error);
    res.status(500).json({
      message: "حدث خطأ في جلب نقاط الدعم",
      error: error.message
    });
  }
}

/** PUT /admin/dashboard/support-tickets/:id/status - تحديث حالة نقطة الدعم */
export async function updateSupportTicketStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, assignee } = req.body;

    if (!status) {
      res.status(400).json({ message: "حالة نقطة الدعم مطلوبة" });
      return;
    }

    const updateData: any = { status };

    if (assignee !== undefined) {
      updateData.assignee = assignee;
    }

    // إذا تم حل المشكلة، أضف تاريخ الحل
    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!ticket) {
      res.status(404).json({ message: "نقطة الدعم غير موجودة" });
      return;
    }

    res.json({
      message: "تم تحديث حالة نقطة الدعم بنجاح",
      ticket
    });

  } catch (error: any) {
    console.error("Error updating support ticket status:", error);
    res.status(500).json({
      message: "حدث خطأ في تحديث حالة نقطة الدعم",
      error: error.message
    });
  }
}

/** POST /admin/dashboard/support-tickets/:id/notes - إضافة ملاحظة إلى نقطة الدعم */
export async function addSupportTicketNote(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { note, internal } = req.body;

    if (!note || !note.trim()) {
      res.status(400).json({ message: "الملاحظة مطلوبة" });
      return;
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
          res.status(404).json({ message: "نقطة الدعم غير موجودة" });
      return;
    }

    // إضافة الملاحظة إلى التذكرة (يمكن توسيع هذا لاحقًا لحفظ الملاحظات بشكل منفصل)
    const noteData = {
      text: note.trim(),
      addedBy: (req as any).userData?.email || "admin",
      internal: internal || false,
      createdAt: new Date()
    };

    // تحديث تاريخ آخر تحديث
    await SupportTicket.findByIdAndUpdate(id, {
      $set: { updatedAt: new Date() }
    });

    res.json({
      message: "تم إضافة الملاحظة بنجاح",
      note: noteData
    });

  } catch (error: any) {
    console.error("Error adding support ticket note:", error);
    res.status(500).json({
      message: "حدث خطأ في إضافة الملاحظة",
      error: error.message
    });
  }
}
