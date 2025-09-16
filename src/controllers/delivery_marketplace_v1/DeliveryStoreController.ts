import { Request, Response } from "express";
import mongoose from "mongoose";
import DeliveryStore from "../../models/delivery_marketplace_v1/DeliveryStore";
import { computeIsOpen } from "../../utils/storeStatus";
import Vendor from "../../models/vendor_app/Vendor";
import { ensureGLForStore } from "../../accounting/services/ensureEntityGL";
import { Types } from "mongoose";

// Create a new delivery store
export const create = async (req: Request, res: Response) => {
  try {
    const body: any = { ...req.body };
    if ((req as any).user?.role === "vendor") {
      const vendor = await Vendor.findOne({ user: (req as any).user.id });
      if (!vendor) {
        res.status(403).json({ message: "ليس لديك حساب تاجر" });
        return;
      }
      if (vendor.store.toString() !== req.body.store) {
        res
          .status(403)
          .json({ message: "ليس لديك صلاحية إضافة منتج لهذا المتجر" });
        return;
      }
    }
    // Convert category to ObjectId if valid
    if (body.category && mongoose.Types.ObjectId.isValid(body.category)) {
      body.category = new mongoose.Types.ObjectId(body.category);
    }

    // Parse schedule JSON string into array
    if (typeof body.schedule === "string") {
      try {
        body.schedule = JSON.parse(body.schedule);
      } catch (err) {
        res.status(400).json({ message: "Invalid schedule format" });
        return;
      }
    }

    // Convert lat/lng to location object
    if (body.lat != null && body.lng != null) {
      body.location = {
        lat: parseFloat(body.lat),
        lng: parseFloat(body.lng),
      };
      delete body.lat;
      delete body.lng;
    }

    // Ensure image and logo URLs are provided
    if (!body.image || !body.logo) {
      res.status(400).json({ message: "Image and logo URLs are required" });
      return;
    }

    // تحويل pricingStrategy إلى ObjectId إذا موجودة وصحيحة
    if (
      body.pricingStrategy &&
      mongoose.Types.ObjectId.isValid(body.pricingStrategy)
    ) {
      body.pricingStrategy = new mongoose.Types.ObjectId(body.pricingStrategy);
    } else if (
      body.pricingStrategy === "" ||
      body.pricingStrategy === undefined
    ) {
      body.pricingStrategy = null;
    }
    if ("isTrending" in body) body.isTrending = !!body.isTrending;
    if ("isFeatured" in body) body.isFeatured = !!body.isFeatured;
    if ("pricingStrategyType" in body)
      body.pricingStrategyType = body.pricingStrategyType || "";

    if ("commissionRate" in body)
      body.commissionRate = parseFloat(body.commissionRate) || 0;

    const data = new DeliveryStore(body);
    await data.save();
    try {
      await ensureGLForStore(data._id.toString(), {
        storeName: data.name,
        storeCodeSuffix: data._id.toString().slice(-6),
        payableParentCode: "2102",
      });
    } catch (e) {
      // لا تكسر الإنشاء إن فشل الربط المحاسبي، فقط سجله أو أعد تحذير
      console.warn("ensureGLForStore failed:", (e as Error).message);
    }

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Read all delivery stores
// Read all delivery stores
export const getAll = async (req: Request, res: Response) => {
  try {
    const { categoryId, usageType } = req.query;

    // ✅ اعتبر المتجر فعّالاً ما لم يكن isActive === false
    const activeMatch: any = {
      $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
    };

    const match: any = { ...activeMatch };

    // ✅ فلترة النوع (لو مرّرته من الواجهة)
    if (usageType) match.usageType = usageType;

    // ✅ فئة: طابق في category المفرد و categories[] كـ ObjectId وكـ String
    if (categoryId) {
      const cidStr = String(categoryId);
      const cidObj = mongoose.Types.ObjectId.isValid(cidStr)
        ? new mongoose.Types.ObjectId(cidStr)
        : null;

      const orForCategory: any[] = [];
      if (cidObj) {
        orForCategory.push({ category: cidObj }, { categories: cidObj });
      }
      // دعم السجلات القديمة/المعطوبة التي خزّنت كسلسلة
      orForCategory.push({ category: cidStr }, { categories: cidStr });

      match.$and = [...(match.$and || []), { $or: orForCategory }];
    }

    // ⚠️ اللوج يجب أن يطبع نفس الشيء الذي سنستعلم به
    console.log(
      "[stores] DB:",
      mongoose.connection.db.databaseName,
      "match:",
      JSON.stringify(match)
    );

    const stores = await DeliveryStore.find(match)
      .populate("category") // ref: DeliveryCategory
      .sort({ createdAt: -1 })
      .lean();

    console.log("[stores] count:", stores.length);

    const enriched = stores.map((store) => ({
      ...store,
      isOpen: computeIsOpen(
        store.schedule,
        !!store.forceClosed,
        !!store.forceOpen
      ),
    }));

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Read a single delivery store by ID
export const getById = async (req: Request, res: Response) => {
  try {
    const store = await DeliveryStore.findById(req.params.id)
      .populate("category", "name usageType")
      .lean();
    if (!store) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    const enrichedStore = {
      ...store,
      isOpen: computeIsOpen(
        store.schedule,
        !!store.forceClosed,
        !!store.forceOpen
      ),
    };

    res.json(enrichedStore);
    return;
  } catch (error: any) {
    res.status(500).json({ message: error.message });
    return;
  }
};

// Update an existing delivery store
export const update = async (req: Request, res: Response) => {
  try {
    const body: any = { ...req.body };

    // Convert lat/lng to location object if present
    if (body.lat != null && body.lng != null) {
      body.location = {
        lat: parseFloat(body.lat),
        lng: parseFloat(body.lng),
      };
      delete body.lat;
      delete body.lng;
    }
    if ((req as any).user?.role === "vendor") {
      const vendor = await Vendor.findOne({ user: (req as any).user.id });
      if (!vendor) {
        res.status(403).json({ message: "ليس لديك حساب تاجر" });
        return;
      }
      if (vendor.store.toString() !== req.body.store) {
        res
          .status(403)
          .json({ message: "ليس لديك صلاحية إضافة منتج لهذا المتجر" });
        return;
      }
    }

    // Parse schedule JSON string into array
    if (typeof body.schedule === "string") {
      try {
        body.schedule = JSON.parse(body.schedule);
      } catch (err) {
        res.status(400).json({ message: "Invalid schedule format" });
        return;
      }
    }

    // Convert category to ObjectId if valid
    if (body.category && mongoose.Types.ObjectId.isValid(body.category)) {
      body.category = new mongoose.Types.ObjectId(body.category);
    }

    // تحويل pricingStrategy إلى ObjectId إذا موجودة وصحيحة
    if (
      body.pricingStrategy &&
      mongoose.Types.ObjectId.isValid(body.pricingStrategy)
    ) {
      body.pricingStrategy = new mongoose.Types.ObjectId(body.pricingStrategy);
    } else if (
      body.pricingStrategy === "" ||
      body.pricingStrategy === undefined
    ) {
      body.pricingStrategy = null;
    }

    const updated = await DeliveryStore.findByIdAndUpdate(req.params.id, body, {
      new: true,
    });

    if (!updated) {
      res.status(404).json({ message: "Store not found" });
      return;
    }
    if (!updated.glPayableAccount) {
      try {
        await ensureGLForStore(updated._id.toString(), {
          storeName: updated.name,
          storeCodeSuffix: updated._id.toString().slice(-6),
          payableParentCode: "2102",
        });
      } catch (e) {
        console.warn("ensureGLForStore (update) failed:", (e as Error).message);
      }
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type BuildOpts = {
  q: string;
  categoryId?: string;
  filter: string;
  pageNum: number;
  lim: number;
  skip: number;
  latNum?: number;
  lngNum?: number;
  userObjId: Types.ObjectId | null;
  useText: boolean; // جرّب text أولًا ثم ارجع لregex عند الفشل
};

function buildPipeline({
  q,
  categoryId,
  filter,
  pageNum,
  lim,
  skip,
  latNum,
  lngNum,
  userObjId,
  useText,
}: BuildOpts) {
  // اعتبر المتجر فعّالًا إن لم يكن isActive === false
  const activeMatch: any = {
    $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
  };

  // فئة: طابق في كلٍّ من category المفرد و categories[]
  const match: any = { ...activeMatch };
  if (categoryId && Types.ObjectId.isValid(categoryId)) {
    const cid = new Types.ObjectId(categoryId);
    match.$and = [
      ...(match.$and || []),
      { $or: [{ category: cid }, { categories: cid }] },
    ];
  }

  const hasGeo =
    filter === "nearest" &&
    Number.isFinite(latNum!) &&
    Number.isFinite(lngNum!);

  const pipeline: any[] = [];

  // 1) الأقرب
  if (hasGeo) {
    const nameRx = q ? new RegExp(escapeRegex(q), "i") : null;
    pipeline.push({
      $geoNear: {
        near: { type: "Point", coordinates: [lngNum!, latNum!] },
        distanceField: "distanceMeters",
        spherical: true,
        key: "geo", // 👈 مهم جدًا

        query: {
          ...match,
          ...(nameRx
            ? { $or: [{ name: nameRx }, { address: nameRx }, { tags: nameRx }] }
            : {}),
        },
      },
    });
  } else {
    pipeline.push({ $match: match });

    // 2) البحث النصي
    if (q) {
      if (useText) {
        pipeline.push({ $match: { $text: { $search: q } } });
        pipeline.push({ $addFields: { textScore: { $meta: "textScore" } } });
      } else {
        const rx = new RegExp(escapeRegex(q), "i");
        pipeline.push({
          $match: { $or: [{ name: rx }, { address: rx }, { tags: rx }] },
        });
      }
    }
  }

  // 3) المفضلة
  if (filter === "favorite") {
    if (!userObjId) {
      // سيرجع فارغًا لاحقًا
      pipeline.push({ $match: { _id: null } });
    } else {
      pipeline.push({
        $lookup: {
          from: "favorites",
          let: { storeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$item", "$$storeId"] },
                    { $eq: ["$user", userObjId] },
                    { $eq: ["$itemType", "restaurant"] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "fav",
        },
      });
      pipeline.push({ $match: { $expr: { $gt: [{ $size: "$fav" }, 0] } } });
      pipeline.push({ $addFields: { isFavorite: true } });
    }
  } else if (userObjId) {
    pipeline.push({
      $lookup: {
        from: "favorites",
        let: { storeId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$item", "$$storeId"] },
                  { $eq: ["$user", userObjId] },
                  { $eq: ["$itemType", "restaurant"] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "fav",
      },
    });
    pipeline.push({
      $addFields: { isFavorite: { $gt: [{ $size: "$fav" }, 0] } },
    });
  }

  // 3.1) فلاتر إضافية
  if (filter === "trending") {
    pipeline.push({ $match: { isTrending: true } });
  }

  if (filter === "freeDelivery") {
    pipeline.push({
      $match: {
        $or: [
          { freeDelivery: true }, // لو عندك هذا الحقل
          { deliveryBaseFee: { $eq: 0 } }, // أو سياسة توصيل مجانية برسوم أساس = 0
        ],
      },
    });
  }

  if (filter === "topRated") {
    // فلترة خفيفة لعدم إظهار متاجر بدون تقييمات
    pipeline.push({
      $match: { rating: { $gt: 0 }, ratingsCount: { $gte: 3 } },
    });
  }

  // 4) أسماء الفئات
  pipeline.push({
    $lookup: {
      from: "deliverycategories",
      localField: "category",
      foreignField: "_id",
      as: "categories",
      pipeline: [{ $project: { name: 1 } }],
    },
  });

  // 5) الترتيب
  if (hasGeo) {
    pipeline.push({ $sort: { distanceMeters: 1, rating: -1 } });
  } else if (q && useText) {
    pipeline.push({ $sort: { textScore: -1, rating: -1, createdAt: -1 } });
  } else if (filter === "new") {
    pipeline.push({ $sort: { createdAt: -1 } });
  } else if (filter === "favorite") {
    pipeline.push({ $sort: { updatedAt: -1 } });
  } else if (filter === "topRated") {
    pipeline.push({ $sort: { rating: -1, ratingsCount: -1 } });
  } else if (filter === "trending") {
    pipeline.push({ $sort: { ordersCount: -1, rating: -1 } });
  } else if (filter === "freeDelivery") {
    pipeline.push({ $sort: { rating: -1, ordersCount: -1 } });
  } else {
    pipeline.push({ $sort: { rating: -1, ordersCount: -1, createdAt: -1 } });
  }

  // 6) صفحة
  pipeline.push(
    { $skip: skip },
    { $limit: lim },
    { $project: { fav: 0, textScore: 0 } }
  );

  return pipeline;
}

export async function searchStores(req: Request, res: Response) {
  const {
    q = "",
    categoryId,
    filter = "all",
    page = "1",
    limit = "20",
    lat,
    lng,
  } = req.query as any;

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const lim = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
  const skip = (pageNum - 1) * lim;

  const userIdStr =
    (req as any).user?._id ||
    (req as any).user?.mongoId ||
    (req as any).user?.id ||
    null;
  const userObjId =
    userIdStr && Types.ObjectId.isValid(String(userIdStr))
      ? new Types.ObjectId(String(userIdStr))
      : null;

  const latNum = lat != null ? parseFloat(lat) : NaN;
  const lngNum = lng != null ? parseFloat(lng) : NaN;

  // المحاولة الأولى: text (إن كان فيه فهرس)
  let items: any[] = [];
  try {
    const pipeText = buildPipeline({
      q,
      categoryId,
      filter,
      pageNum,
      lim,
      skip,
      latNum,
      lngNum,
      userObjId,
      useText: true,
    });
    items = await (DeliveryStore as any).aggregate(pipeText, {
      allowDiskUse: true,
    });
  } catch (err: any) {
    // أي خطأ → جرّب Regex
    const pipeRx = buildPipeline({
      q,
      categoryId,
      filter,
      pageNum,
      lim,
      skip,
      latNum,
      lngNum,
      userObjId,
      useText: false,
    });
    try {
      items = await (DeliveryStore as any).aggregate(pipeRx, {
        allowDiskUse: true,
      });
    } catch (e2: any) {
      console.error("searchStores final error:", e2?.message || e2);
      res.status(500).json({ message: "Search failed" });
      return;
    }
  }

  res.json({ items, page: pageNum, hasMore: items.length === lim });
}

// Delete a delivery store
export const remove = async (req: Request, res: Response) => {
  try {
    if ((req as any).user?.role === "vendor") {
      const vendor = await Vendor.findOne({ user: (req as any).user.id });
      if (!vendor) {
        res.status(403).json({ message: "ليس لديك حساب تاجر" });
        return;
      }
      if (vendor.store.toString() !== req.body.store) {
        res
          .status(403)
          .json({ message: "ليس لديك صلاحية إضافة منتج لهذا المتجر" });
        return;
      }
    }
    await DeliveryStore.findByIdAndDelete(req.params.id);

    res.json({ message: "DeliveryStore deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
