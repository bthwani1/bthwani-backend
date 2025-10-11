// src/controllers/vendor_app/settlement.controller.ts
import { Request, Response } from "express";
import { parseListQuery } from "../../utils/query";
import mongoose from "mongoose";
import SettlementRequest, { ISettlementRequest } from "../../models/vendor_app/SettlementRequest";
import Vendor from "../../models/vendor_app/Vendor";
import { computeVendorBalance } from "../../services/vendor/balance.service";

// إنشاء طلب تسوية جديد
export const createSettlementRequest = async (req: Request, res: Response) => {
  try {
    const vendorId = (req.user as any).vendorId as string;
    const { amount, bankAccount } = req.body;

    // التحقق من صحة البيانات
    if (!amount || amount <= 0) {
      res.status(400).json({ message: "يجب إدخال مبلغ صحيح أكبر من صفر" });
      return;
    }

    // جلب بيانات التاجر
    const vendor = await Vendor.findOne({ user: vendorId }).populate("store");
    if (!vendor) {
      res.status(404).json({ message: "التاجر غير موجود" });
      return;
    }

    // حساب الرصيد المتاح
    const balance = await computeVendorBalance(vendor.store);

    if (amount > balance.net) {
      res.status(400).json({
        message: "المبلغ المطلوب أكبر من الرصيد المتاح",
        availableBalance: balance.net
      });
      return;
    }

    // إنشاء طلب التسوية
    const settlementRequest = new SettlementRequest({
      vendor: vendor._id,
      store: vendor.store,
      amount,
      bankAccount,
      status: "pending"
    });

    await settlementRequest.save();

    res.status(201).json({
      message: "تم إرسال طلب التسوية بنجاح",
      settlementRequest
    });
  } catch (err: any) {
    console.error("createSettlementRequest error:", err);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء طلب التسوية" });
  }
};

// جلب طلبات التسوية الخاصة بالتاجر
export const getMySettlementRequests = async (req: Request, res: Response) => {
  try {
    const vendorId = (req.user as any).vendorId as string;

    const vendor = await Vendor.findOne({ user: vendorId });
    if (!vendor) {
      res.status(404).json({ message: "التاجر غير موجود" });
      return;
    }

    const settlementRequests = await SettlementRequest.find({
      vendor: vendor._id
    })
      .populate("store", "name")
      .sort({ requestedAt: -1 });

    res.json(settlementRequests);
  } catch (err: any) {
    console.error("getMySettlementRequests error:", err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب طلبات التسوية" });
  }
};

// جلب تفاصيل طلب تسوية محدد
export const getSettlementRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendorId = (req.user as any).vendorId as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "معرف طلب التسوية غير صحيح" });
      return;
    }

    const vendor = await Vendor.findOne({ user: vendorId });
    if (!vendor) {
      res.status(404).json({ message: "التاجر غير موجود" });
      return;
    }

    const settlementRequest = await SettlementRequest.findOne({
      _id: id,
      vendor: vendor._id
    }).populate("store", "name");

    if (!settlementRequest) {
      res.status(404).json({ message: "طلب التسوية غير موجود" });
      return;
    }

    res.json(settlementRequest);
  } catch (err: any) {
    console.error("getSettlementRequestById error:", err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب طلب التسوية" });
  }
};

// إلغاء طلب تسوية (فقط إذا كان في حالة pending)
export const cancelSettlementRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendorId = (req.user as any).vendorId as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "معرف طلب التسوية غير صحيح" });
      return;
    }

    const vendor = await Vendor.findOne({ user: vendorId });
    if (!vendor) {
      res.status(404).json({ message: "التاجر غير موجود" });
      return;
    }

    const settlementRequest = await SettlementRequest.findOneAndUpdate(
      {
        _id: id,
        vendor: vendor._id,
        status: "pending"
      },
      { status: "rejected" },
      { new: true }
    );

    if (!settlementRequest) {
      res.status(404).json({ message: "طلب التسوية غير موجود أو لا يمكن إلغاؤه" });
      return;
    }

    res.json({
      message: "تم إلغاء طلب التسوية بنجاح",
      settlementRequest
    });
  } catch (err: any) {
    console.error("cancelSettlementRequest error:", err);
    res.status(500).json({ message: "حدث خطأ أثناء إلغاء طلب التسوية" });
  }
};

// جلب الرصيد المتاح للتاجر
export const getMyBalance = async (req: Request, res: Response) => {
  try {
    const vendorId = (req.user as any).vendorId as string;

    const vendor = await Vendor.findOne({ user: vendorId });
    if (!vendor) {
      res.status(404).json({ message: "التاجر غير موجود" });
      return;
    }

    const balance = await computeVendorBalance(vendor.store);

    res.json({
      store: vendor.store,
      balance
    });
  } catch (err: any) {
    console.error("getMyBalance error:", err);
    res.status(500).json({ message: "حدث خطأ أثناء حساب الرصيد" });
  }
};

// دوال للإدارة (Admin functions)

// جلب جميع طلبات التسوية (للإدارة)
export const getAllSettlementRequests = async (req: Request, res: Response) => {
  try {
    const { page, perPage, sort, filters } = parseListQuery(req.query);

    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.vendorId) query.vendor = filters.vendorId;

    const total = await SettlementRequest.countDocuments(query);
    const settlementRequests = await SettlementRequest.find(query)
      .populate("vendor", "fullName phone email")
      .populate("store", "name")
      .sort(sort ?? { requestedAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    res.json({
      settlementRequests,
      pagination: {
        page,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage)
      },
      items: settlementRequests,
      meta: { page, per_page: perPage, total, returned: settlementRequests.length },
    });
  } catch (err: any) {
    console.error("getAllSettlementRequests error:", err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب طلبات التسوية" });
  }
};

// تحديث حالة طلب التسوية (للإدارة)
export const updateSettlementStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, processedAt } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "معرف طلب التسوية غير صحيح" });
      return;
    }

    if (!["pending", "completed", "rejected"].includes(status)) {
      res.status(400).json({ message: "حالة غير صحيحة" });
      return;
    }

    const updateData: any = { status };
    if (status === "completed" && processedAt) {
      updateData.processedAt = new Date(processedAt);
    }

    const settlementRequest = await SettlementRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("vendor", "fullName phone email")
      .populate("store", "name");

    if (!settlementRequest) {
      res.status(404).json({ message: "طلب التسوية غير موجود" });
      return;
    }

    res.json({
      message: "تم تحديث حالة طلب التسوية بنجاح",
      settlementRequest
    });
  } catch (err: any) {
    console.error("updateSettlementStatus error:", err);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث حالة طلب التسوية" });
  }
};



