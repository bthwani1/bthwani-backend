// controllers/delivery_Marketplace_V1/promotion.controller.ts
import { Request, Response } from "express";
import Promotion from "../../models/delivery_marketplace_v1/Promotion";
import mongoose from "mongoose";

const now = new Date();

// Create
export const createPromotion = async (req: Request, res: Response) => {
  try {
    const promo = new Promotion(req.body);
    await promo.save();
    res.status(201).json(promo);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: get all promotions with optional status filter
export const getAllPromotionsAdmin = async (req: Request, res: Response) => {
  try {
    const {
      status = "all",         // all | active | expired | upcoming | inactive
      placement,              // comma-separated
      target,                 // product | store | category
      store, product, category
    } = req.query as any;

    const now = new Date();
    const q: any = {};

    // حالة العرض
    if (status !== "all") {
      if (status === "active") {
        q.isActive = true;
        q.$or = [
          { startDate: { $exists: false }, endDate: { $exists: false } },
          { startDate: { $lte: now }, endDate: { $exists: false } },
          { startDate: { $exists: false }, endDate: { $gte: now } },
          { startDate: { $lte: now }, endDate: { $gte: now } },
        ];
      } else if (status === "expired") {
        q.endDate = { $lt: now };
      } else if (status === "upcoming") {
        q.startDate = { $gt: now };
      } else if (status === "inactive") {
        q.isActive = false;
      }
    }

    // فلاتر اختيارية
    if (placement) q.placements = { $in: String(placement).split(",").map(s => s.trim()).filter(Boolean) };
    if (target) q.target = String(target);
    if (store) q.store = store;
    if (product) q.product = product;
    if (category) q.category = category;

    const list = await Promotion.find(q)
      .sort({ order: 1, createdAt: -1 })
      .populate([
        { path: "product", select: "name image price" },
        { path: "store", select: "name" },
        { path: "category", select: "name" },
      ])
      .lean();

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get all (للعميل وغير المسؤول)
export const getActivePromotions = async (req: Request, res: Response) => {
  try {
    const { placement, city, channel } = req.query as any;

    const now = new Date();
    const filter: any = {
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: now } },
          ],
        },
        { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }] },
      ],
    };

    if (placement) filter.placements = placement;
    if (city) filter.$or = [{ cities: { $size: 0 } }, { cities: city }];
    if (channel)
      filter.$and.push({
        $or: [{ channels: { $size: 0 } }, { channels: channel }],
      });

    const promos = await Promotion.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .populate("product store category");

    res.json(promos);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
export const getPromotionsByProducts = async (req: Request, res: Response) => {
  try {
    const idsParam = (req.query.ids as string) || "";
    const rawIds = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const productIds = rawIds
      .filter(mongoose.Types.ObjectId.isValid)
      .map((id) => new mongoose.Types.ObjectId(id));
    if (!productIds.length) {
      res.status(400).json({ message: "ids (valid ObjectIds) are required" });
      return;
    }

    const now = new Date();
    const { channel, city } = req.query as any;

    const filter: any = {
      isActive: true,
      target: "product",
      product: { $in: productIds },
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: now } },
          ],
        },
        { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }] },
      ],
    };
    if (channel) {
      filter.$and.push({
        $or: [{ channels: { $size: 0 } }, { channels: channel }],
      });
    }
    if (city) {
      filter.$and.push({ $or: [{ cities: { $size: 0 } }, { cities: city }] });
    }

    const promos = await Promotion.find(filter)
      .select("_id product value valueType order title")
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const map: Record<
      string,
      {
        _id: string;
        value?: number;
        valueType?: "percentage" | "fixed";
        title?: string;
      }[]
    > = {};
    for (const p of promos) {
      const key = (p.product as any).toString();
      if (!map[key]) map[key] = [];
      map[key].push({
        _id: p._id.toString(),
        value: p.value,
        valueType: p.valueType as any,
        title: (p as any).title,
      });
    }
    res.json(map);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
export const getPromotionsByStores = async (req: Request, res: Response) => {
  try {
    const {
      ids = "",
      channel,
      city,
      placement,
    } = req.query as Record<string, string>;
    const storeIds = ids
      .split(",")
      .map((s) => s.trim())
      .filter((s) => mongoose.Types.ObjectId.isValid(s));

    if (!storeIds.length) {
      res.json({}); // ارجع خريطة فاضية لو ما وصل شيء صحيح
      return;
    }

    const now = new Date();
    const clauses: any[] = [
      { isActive: true },
      { target: "store" },
      { store: { $in: storeIds } },
      {
        $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }],
      },
      { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }] },
    ];

    // helper: field allow empty/not-set OR match value
    const inOrEmpty = (field: string, v: any) => ({
      $or: [
        { [field]: { $exists: false } },
        { [field]: { $size: 0 } },
        { [field]: v },
      ],
    });

    if (channel) clauses.push(inOrEmpty("channels", channel));
    if (city) clauses.push(inOrEmpty("cities", city));
    if (placement) clauses.push(inOrEmpty("placements", placement));

    const filter = { $and: clauses };

    const promos = await Promotion.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select(
        "_id title value valueType store startDate endDate stacking maxDiscountAmount"
      )
      .lean();

    // build map: storeId -> promos[]
    const map: Record<string, any[]> = {};
    for (const p of promos) {
      const sid = (p.store as any)?.toString?.() || p.store;
      if (!sid) continue;
      (map[sid] ||= []).push({
        _id: p._id,
        title: p.title,
        value: p.value,
        valueType: p.valueType,
        startDate: p.startDate,
        endDate: p.endDate,
        stacking: p.stacking,
        maxDiscountAmount: p.maxDiscountAmount,
      });
    }

    res.json(map);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
// Get by ID
export const getPromotionById = async (req: Request, res: Response) => {
  try {
    const promo = await Promotion.findById(req.params.id);
    if (!promo) {
      res.status(404).json({ message: "Promotion not found" });
      return;
    }
    res.json(promo);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Update
export const updatePromotion = async (req: Request, res: Response) => {
  try {
    const promo = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(promo);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Delete
export const deletePromotion = async (req: Request, res: Response) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id);
    res.json({ message: "Promotion deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
