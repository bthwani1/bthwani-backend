import { Router } from "express";
import { Request, Response } from "express";

import * as controller from "../../controllers/vendor_app/vendor.controller";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { addVendor } from "../../controllers/admin/vendorController";
import Vendor from "../../models/vendor_app/Vendor";
import Order from "../../models/delivery_marketplace_v1/Order";
import { verifyVendorJWT } from "../../middleware/verifyVendorJWT";
import MerchantProduct from "../../models/mckathi/MerchantProduct";
// routes/vendor.account.ts

import mongoose from "mongoose";
import { computeVendorBalance } from "../../services/vendor/balance.service";
import SettlementRequest from "../../models/vendor_app/SettlementRequest";


// Helper: جلب storeId من التوكن
async function getStoreId(req) {
  const vendor = await Vendor.findById(req.user.vendorId).lean();
  if (!vendor?.store) throw new Error("لا يوجد متجر مرتبط بهذا التاجر");
  return new mongoose.Types.ObjectId(vendor.store);
}
const router = Router();

// 1) الرصيد + ملخص
router.get("/account/statement", verifyVendorJWT, async (req, res) => {
  try {
    const storeId = await getStoreId(req);
    const balance = await computeVendorBalance(storeId);

    const lastCompleted = await SettlementRequest.findOne({
      store: storeId,
      status: "completed",
    })
      .sort({ processedAt: -1 })
      .lean();

    const pendingTotal = await SettlementRequest.aggregate([
      { $match: { store: storeId, status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      currentBalance: balance.net,
      pendingTotal: pendingTotal[0]?.total || 0,
      lastCompleted: lastCompleted
        ? {
            amount: lastCompleted.amount,
            processedDate: lastCompleted.processedAt,
          }
        : null,
    });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 2) كشف المبيعات (بدون أسماء العملاء)
router.get("/sales", verifyVendorJWT, async (req, res) => {
  try {
    const storeId = await getStoreId(req);
    const limit = Math.min(parseInt(String(req.query.limit || 50), 10), 200);
    const sales = await Order.aggregate([
      { $match: { "subOrders.store": storeId } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          orderId: { $toString: "$_id" },
          date: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } },
          // المبلغ كناتج إجمالي العناصر الخاصة بهذا المتجر فقط
          items: "$subOrders.items",
          subOrders: "$subOrders",
          // لا نعيد أي اسم عميل إطلاقًا (Privacy by default)
        },
      },
    ]);

    // حوّل إلى سجل مبسط مع عمولة وصافي (احتساب بسيط)
    const store = await Vendor.findById(req.user.vendorId)
      .populate("store", "commissionRate")
      .lean();
    const commissionRate = (store as any)?.store?.commissionRate ?? 0;

    const flattened = sales.map((s: any) => {
      // احسب إجمالي عناصر هذا المتجر فقط
      let amount = 0;
      for (const so of s.subOrders) {
        if (String(so.store) === String(storeId)) {
          for (const it of so.items || []) {
            amount += (it.unitPrice || 0) * (it.quantity || 0);
          }
        }
      }
      const commission = Math.round((amount * commissionRate) / 100);
      const netAmount = amount - commission;
      return {
        id: s.orderId,
        orderId: s.orderId,
        amount,
        date: s.date,
        customerCode: `عميل #${s.orderId.slice(-6)}`, // معرف بديل غير معرف شخصي
        commission,
        netAmount,
      };
    });

    res.json(flattened);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 3) إنشاء طلب تصفية
router.post("/settlements", verifyVendorJWT, async (req, res) => {
  try {
    const { amount, bankAccount } = req.body;
    const storeId = await getStoreId(req);
    const vendorId = req.user.vendorId;

    if (!amount || amount <= 0) {
      res.status(400).json({ message: "الرجاء إدخال مبلغ صحيح" });
      return;
    }
    if (amount < 30000) {
      res.status(400).json({ message: "أقل مبلغ للسحب هو 30,000" });
      return;
    }

    const { net } = await computeVendorBalance(storeId);
    if (amount > net) {
      res.status(400).json({ message: "المبلغ المطلوب أكبر من الرصيد المتاح" });
      return;
    }

    const reqDoc = await SettlementRequest.create({
      vendor: vendorId,
      store: storeId,
      amount,
      status: "pending",
      bankAccount,
    });

    res.status(201).json(reqDoc);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 4) سجل طلبات التصفية (للتاجر)
router.get("/settlements", verifyVendorJWT, async (req, res) => {
  try {
    const storeId = await getStoreId(req);
    const list = await SettlementRequest.find({ store: storeId })
      .sort({ requestedAt: -1 })
      .lean();
    res.json(
      list.map((r) => ({
        id: String(r._id),
        amount: r.amount,
        status: r.status,
        requestedDate: r.requestedAt?.toISOString().slice(0, 10),
        processedDate: r.processedAt
          ? r.processedAt.toISOString().slice(0, 10)
          : undefined,
        bankAccount: r.bankAccount || "",
      }))
    );
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});



// كل المسارات هنا محمية بمستخدم مسجّل من نوع vendor
router.get(
  "/",
  verifyFirebase, // ← هذا يحلّل الـ JWT ويضع req.user
  verifyAdmin,
  controller.listVendors
);
// جلب بيانات التاجر (vendor نفسه)

router.post("/auth/vendor-login", controller.vendorLogin);

// تعديل بيانات التاجر (fullName, phone, إلخ)
router.put("/me/profile", verifyVendorJWT, controller.updateMyProfile);
router.get("/me/profile", verifyVendorJWT, controller.getMyProfile);


router.get("/settings/notifications", verifyVendorJWT, async (req, res) => {
  const v = await Vendor.findById(req.user!.vendorId).lean();
  if (!v) {
    res.status(404).json({ message: "Vendor not found" });
    return;
  }
  res.json(v.notificationSettings || {
    enabled: true,
    orderAlerts: true,
    financialAlerts: true,
    marketingAlerts: false,
    systemUpdates: true,
  });
});

// تحديث تفضيلات الإشعارات
router.put("/settings/notifications", verifyVendorJWT, async (req, res) => {
  const body = req.body || {};
  const v = await Vendor.findByIdAndUpdate(
    req.user!.vendorId,
    { $set: { notificationSettings: {
      enabled: !!body.enabled,
      orderAlerts: !!body.orderAlerts,
      financialAlerts: !!body.financialAlerts,
      marketingAlerts: !!body.marketingAlerts,
      systemUpdates: !!body.systemUpdates,
    }}},
    { new: true, projection: { notificationSettings: 1 } }
  ).lean();
  if (!v) {
    res.status(404).json({ message: "Vendor not found" });
    return;
  }
  res.json(v.notificationSettings);
});

// طلب حذف الحساب (الذي تستدعيه من الشاشة)
router.post("/account/delete-request", verifyVendorJWT, async (req, res) => {
  const { reason, exportData } = req.body || {};
  // سجل طلب الحذف في قاعدة البيانات لو عندك موديل مثل DeletionRequest
  // أو اكتفِ بإشارة على حساب البائع pendingDeletion
  await Vendor.updateOne(
    { _id: req.user!.vendorId },
    { $set: { pendingDeletion: { requestedAt: new Date(), reason: reason || null, exportData: !!exportData } } }
  );
  res.status(202).json({ ok: true });
});
router.post("/", verifyFirebase, verifyAdmin, addVendor);
// إضافة متجر جديد (مثلاً يربط vendor بمتجر)
// body: { storeId: ObjectId }
router.post("/stores", controller.attachStoreToVendor);

// حذف الربط أو تعطيل المتجر الخاص بالتاجر
router.delete("/stores/:storeId", controller.detachStoreFromVendor);
router.get("/merchant/reports", verifyFirebase, controller.getMerchantReports);
router.post("/push-token", async (req, res) => {
  const { vendorId, expoPushToken } = req.body;
  // خزنه عندك بجدول vendor أو user
  await Vendor.updateOne({ _id: vendorId }, { expoPushToken });
  res.json({ success: true });
});
router.get(
  "/dashboard/overview",
  verifyVendorJWT,
  async (req: Request, res: Response) => {
    try {
      // احصل على المتجر الخاص بالتاجر من التوكن
      const vendor = await Vendor.findById(req.user.vendorId).lean();
      if (!vendor || !vendor.store) {
        res.status(404).json({ message: "لا يوجد متجر مرتبط بهذا التاجر" });
        return;
      }
      const storeId = vendor.store;

      // مبيعات اليوم/الأسبوع/الشهر
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const startOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay()
      );
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      async function salesStats(from: Date) {
        const stats = await Order.aggregate([
          {
            $match: {
              "subOrders.store": storeId,
              status: "delivered",
              createdAt: { $gte: from },
            },
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: "$price" },
              ordersCount: { $sum: 1 },
            },
          },
        ]);
        return stats[0] || { totalSales: 0, ordersCount: 0 };
      }

      const day = await salesStats(startOfDay);
      const week = await salesStats(startOfWeek);
      const month = await salesStats(startOfMonth);

      // الطلبات حسب الحالة
      const statuses = await Order.aggregate([
        { $match: { "subOrders.store": storeId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      const statusMap = Object.fromEntries(
        statuses.map((s) => [s._id, s.count])
      );

      // المنتجات الأكثر مبيعًا (من merchantproducts فقط)
      const topProducts = await Order.aggregate([
        { $match: { "subOrders.store": storeId, status: "delivered" } },
        { $unwind: "$subOrders" },
        { $match: { "subOrders.store": storeId } },
        { $unwind: "$subOrders.items" },
        { $match: { "subOrders.items.productType": "merchantProduct" } },
        {
          $group: {
            _id: "$subOrders.items.product",
            totalQuantity: { $sum: "$subOrders.items.quantity" },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 8 },
        // جلب اسم المنتج من productcatalogs
        {
          $lookup: {
            from: "productcatalogs",
            localField: "_id",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, totalQuantity: 1, name: "$productInfo.name" } },
      ]);

      // معدل التقييم العام (من rating.company)
      const rating = await Order.aggregate([
        {
          $match: {
            "subOrders.store": storeId,
            status: "delivered",
            "rating.company": { $exists: true },
          },
        },
        { $group: { _id: null, avgRating: { $avg: "$rating.company" } } },
      ]);
      const avgRating = rating[0]?.avgRating || 0;

      // المنتجات الأقل مبيعًا أو منخفضة المخزون
      const allProducts = await MerchantProduct.find({ store: storeId })
        .populate("product", "name") // هكذا ستضيف الحقل name تلقائيًا!
        .lean(); // اجمع عدد مرات بيع كل منتج
      const productsStats = await Order.aggregate([
        { $match: { "subOrders.store": storeId, status: "delivered" } },
        { $unwind: "$subOrders" },
        { $match: { "subOrders.store": storeId } },
        { $unwind: "$subOrders.items" },
        { $match: { "subOrders.items.productType": "merchantProduct" } },
        {
          $group: {
            _id: "$subOrders.items.product",
            sold: { $sum: "$subOrders.items.quantity" },
          },
        },
      ]);
      const statsMap = Object.fromEntries(
        productsStats.map((p) => [p._id.toString(), p.sold])
      );
      const lowestProducts = allProducts
        .map((p) => ({
          _id: p._id,
          name: (p.product as any)?.name || "بدون اسم", // هنا ستجد الاسم في p.product.name
          stock: p.stock || 0,
          sold: statsMap[p._id.toString()] || 0,
        }))
        .sort((a, b) => a.sold - b.sold || a.stock - b.stock)
        .slice(0, 8);

      // رسم بياني زمني للطلبات (30 يوم)
      const startTimeline = new Date();
      startTimeline.setDate(startTimeline.getDate() - 29);
      const timeline = await Order.aggregate([
        {
          $match: {
            "subOrders.store": storeId,
            createdAt: { $gte: startTimeline },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // الرد النهائي
      res.json({
        sales: { day, week, month },
        status: {
          delivered: statusMap.delivered || 0,
          cancelled: statusMap.cancelled || 0,
          preparing: statusMap.preparing || 0,
          out_for_delivery: statusMap.out_for_delivery || 0,
          all: Object.values(statusMap).reduce(
            (a, b) => (a as number) + (b as number),
            0
          ),
        },
        topProducts,
        avgRating,
        lowestProducts,
        timeline,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
