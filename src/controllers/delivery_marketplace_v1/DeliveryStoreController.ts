import { Request, Response } from "express";
import mongoose from "mongoose";
import DeliveryStore from "../../models/delivery_marketplace_v1/DeliveryStore";
import { computeIsOpen } from "../../utils/storeStatus";
import Vendor from "../../models/vendor_app/Vendor";
import { ensureGLForStore } from "../../accounting/services/ensureEntityGL";
import { Types } from "mongoose";
import DeliveryCategory from "../../models/delivery_marketplace_v1/DeliveryCategory";
import { getDistance } from "geolib";
import { parseListQuery } from "../../utils/query";

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

// اجمع كل الأبناء (descendants) لفئة مُعطاة (بما فيهم الأصل)
async function collectDescendantCategoryIds(rootId?: string) {
  const objIds: mongoose.Types.ObjectId[] = [];
  const strIds: string[] = [];
  if (!rootId) return { objIds, strIds };

  const rootStr = String(rootId);
  const rootObj = mongoose.Types.ObjectId.isValid(rootStr)
    ? new mongoose.Types.ObjectId(rootStr)
    : null;

  const visited = new Set<string>();
  const stack: (string | mongoose.Types.ObjectId)[] = [rootObj || rootStr];

  while (stack.length) {
    const cur = stack.pop()!;
    const curStr = String(cur);
    if (visited.has(curStr)) continue;
    visited.add(curStr);

    // أضف المعرف الحالي
    const curObj = mongoose.Types.ObjectId.isValid(curStr)
      ? new mongoose.Types.ObjectId(curStr)
      : null;
    if (curObj) objIds.push(curObj);
    strIds.push(curStr);

    // اجلب الأطفال مباشرة (ندعم parent أو parentId كسلسلة أو ObjectId)
    const children = await DeliveryCategory.find(
      {
        $or: [
          { parent: curObj },
          { parent: curStr },
          { parentId: curObj },
          { parentId: curStr },
        ],
      },
      { _id: 1 }
    ).lean();

    for (const c of children) {
      if (c?._id) stack.push(c._id as string);
    }
  }

  return { objIds, strIds };
}

// Read all delivery stores
export const getAll = async (req: Request, res: Response) => {
  try {
    const { categoryId, usageType } = req.query as {
      categoryId?: string;
      usageType?: string;
    };

    // ✅ المتاجر الفعالة
    const activeMatch: any = {
      $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
    };

    // ✅ جهّز معرّفات الفئة + كل الأبناء
    const { objIds: catObjIds, strIds: catStrIds } =
      await collectDescendantCategoryIds(categoryId);

    // فلترة الفئات (إن وُجدت)
    const categoryFilter = (catObjIds.length || catStrIds.length) && {
      $or: [
        ...(catObjIds.length ? [{ category: { $in: catObjIds } }] : []),
        ...(catStrIds.length ? [{ category: { $in: catStrIds } }] : []),
      ],
    };

    console.log(
      "[stores.getAll] DB:",
      mongoose.connection.db.databaseName,
      "usageType=",
      usageType,
      "categoryId=",
      categoryId,
      "catObjIds=",
      catObjIds.map((x) => String(x)),
      "catStrIds=",
      catStrIds
    );

    let raw: any[] = [];

    if (usageType) {
      // ✅ عندما يمرّر usageType: طابق إمّا usageType على المتجر أو usageType على الفئة
      const pipeline: any[] = [];

      pipeline.push({
        $match: {
          ...activeMatch,
          ...(categoryFilter ? categoryFilter : {}),
        },
      });

      // جلب usageType من الفئة
      pipeline.push({
        $lookup: {
          from: "deliverycategories",
          localField: "category",
          foreignField: "_id",
          as: "cat",
          pipeline: [{ $project: { usageType: 1 } }],
        },
      });
      pipeline.push({
        $addFields: { catUsage: { $arrayElemAt: ["$cat.usageType", 0] } },
      });

      pipeline.push({
        $match: {
          $or: [
            { usageType: String(usageType) },
            { catUsage: String(usageType) },
          ],
        },
      });

      pipeline.push({ $sort: { createdAt: -1 } });
      pipeline.push({ $project: { cat: 0, catUsage: 0 } });

      raw = await (DeliveryStore as any).aggregate(pipeline, {
        allowDiskUse: true,
      });
    } else {
      // ✅ بدون usageType
      const match: any = { ...activeMatch, ...(categoryFilter || {}) };

      // اطبع الـ match للتحقق
      console.log("[stores.getAll] match:", JSON.stringify(match));

      raw = await DeliveryStore.find(match)
        .populate("category") // ref: DeliveryCategory
        .sort({ createdAt: -1 })
        .lean();
    }

    console.log("[stores.getAll] count:", raw.length);

    const enriched = raw.map((store) => ({
      ...store,
      isOpen: computeIsOpen(
        store.schedule,
        !!store.forceClosed,
        !!store.forceOpen
      ),
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error("getAll error:", error?.message || error);
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

export const searchStores = async (req: Request, res: Response) => {
  try {
    const { q, page, perPage } = parseListQuery(req.query);
    const categoryId = (req.query.categoryId as string) || undefined;
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const skip = (page - 1) * perPage;

    const and: any[] = [
      { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] },
    ];
    if (q) and.push({ name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } });
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      and.push({ category: new mongoose.Types.ObjectId(categoryId) });
    }

    const filter = and.length ? { $and: and } : {};
    let items = await DeliveryStore.find(filter)
      .select("_id name logo address location isActive category")
      .skip(skip)
      .limit(perPage)
      .lean();

    // ترتيب بالأقرب إن وُجد lat/lng صالحين
    if (lat != null && lng != null) {
      items = items
        .map((s: any) => {
          const storeLat = s?.location?.lat;
          const storeLng = s?.location?.lng;
          const dist = (storeLat != null && storeLng != null)
            ? getDistance(
                { latitude: lat, longitude: lng },
                { latitude: storeLat, longitude: storeLng }
              )
            : Number.MAX_SAFE_INTEGER;
          return { ...s, distance: dist };
        })
        .sort((a: any, b: any) => a.distance - b.distance);
    }

    const total = await DeliveryStore.countDocuments(filter);
    const hasMore = page * perPage < total;

    res.json({ items, hasMore });
  } catch (err: any) {
    console.error("searchStores error:", err);
    res.status(500).json({ message: err?.message || "Server error" });
  }
};

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
