import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Vendor from "../../models/vendor_app/Vendor";
import { parseListQuery } from "../../utils/query";

export async function list(req: Request, res: Response) {
  const { q, page, perPage, filters, sort } = parseListQuery(req.query);

  const filter: any = {};
  if (typeof req.query.active !== "undefined") filter.isActive = req.query.active === "true";
  if (filters?.storeId && mongoose.Types.ObjectId.isValid(filters.storeId))
    filter.store = new mongoose.Types.ObjectId(filters.storeId);
  if (q) filter.$or = [{ fullName: new RegExp(q, "i") }, { phone: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];

  const total = await Vendor.countDocuments(filter);
  const vendors = await Vendor.find(filter)
    .populate("store", "name address")
    .select("-password")
    .sort(sort ?? { createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage)
    .lean();

  // نحافظ على شكل الواجهة الحالية + نقدّم meta قياسي اختياريًا
  res.json({
    vendors,
    pagination: {
      page,
      limit: perPage,
      total,
      pages: Math.ceil(total / perPage),
    },
    // شكل موحّد (اختياري للاستهلاك الجديد):
    items: vendors,
    meta: { page, per_page: perPage, total, returned: vendors.length },
  });
}

export async function getOne(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: "id غير صالح" });
    return;
  }
  const v = await Vendor.findById(req.params.id)
    .populate("store", "name address")
    .select("-password")
    .lean();
  if (!v) {
    res.status(404).json({ message: "غير موجود" });
    return;
  }
  res.json(v);
}

export async function listByStore(req: Request, res: Response) {
  const { storeId } = req.params;
  if (!mongoose.isValidObjectId(storeId)) {
    res.status(400).json({ message: "storeId غير صالح" });
    return;
  }
  const data = await Vendor.find({ store: storeId })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();
  res.json(data);
}

export async function activate(req: Request, res: Response) {
  const v = await Vendor.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  ).select("-password");
  if (!v) {
    res.status(404).json({ message: "غير موجود" });
    return;
  }
  res.json(v);
}

export async function deactivate(req: Request, res: Response) {
  const v = await Vendor.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select("-password");
  if (!v) {
    res.status(404).json({ message: "غير موجود" });
    return;
  }
  res.json(v);
}

export async function update(req: Request, res: Response) {
  const allow = ["fullName", "phone", "email", "store", "isActive"];
  const patch: any = {};
  for (const k of allow) if (k in req.body) patch[k] = req.body[k];
  const v = await Vendor.findByIdAndUpdate(req.params.id, patch, {
    new: true,
  }).select("-password");
  if (!v) {
    res.status(404).json({ message: "غير موجود" });
    return;
  }
  res.json(v);
}

export async function resetPassword(req: Request, res: Response) {
  const { password } = req.body || {};
  if (!password || String(password).length < 8) {
    res.status(400).json({ message: "كلمة مرور غير صالحة (>=8)" });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const v = await Vendor.findByIdAndUpdate(
    req.params.id,
    { password: hash },
    { new: true }
  );
  if (!v) {
    res.status(404).json({ message: "غير موجود" });
    return;
  }
  res.json({ ok: true });
}

export async function remove(req: Request, res: Response) {
  const v = await Vendor.findByIdAndDelete(req.params.id);
  if (!v) {
    res.status(404).json({ message: "غير موجود" });
    return;
  }
  res.json({ ok: true });
}
