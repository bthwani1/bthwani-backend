import { Request, Response } from "express";
import DeliveryProduct from "../../models/delivery_marketplace_v1/DeliveryProduct";
import Vendor from "../../models/vendor_app/Vendor";
import StoreSection from "../../models/delivery_marketplace_v1/StoreSection";
import mongoose from "mongoose";
import {
  applyPromotionToProduct,
  fetchActivePromotions,
} from "../../services/promotion/pricing.service";

// Create
export const create = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // تأكد من وجود متجر وقسم داخلي في البدي
    if (!body.store) {
      res.status(400).json({ message: "storeId is required" });
      return;
    }
    if (!body.subCategory) {
      res.status(400).json({ message: "subCategory (الفئة الداخلية) مطلوب" });
      return;
    }
    if (
      !mongoose.Types.ObjectId.isValid(body.store) ||
      !mongoose.Types.ObjectId.isValid(body.subCategory)
    ) {
      res.status(400).json({ message: "Invalid storeId or subCategory" });
      return;
    }

    // تحقق أن القسم فعلاً يتبع المتجر
    const section = await StoreSection.findById(body.subCategory);
    if (!section || section.store.toString() !== body.store) {
      res
        .status(400)
        .json({ message: "فئة داخلية غير صالحة أو لا تتبع المتجر" });
      return;
    }

    // للـ vendor فقط: تحقق أنه يملك هذا المتجر
    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ user: req.user.id });
      if (!vendor) {
        res.status(403).json({ message: "ليس لديك حساب تاجر" });
        return;
      }
      if (vendor.store.toString() !== body.store) {
        res
          .status(403)
          .json({ message: "ليس لديك صلاحية إضافة منتج لهذا المتجر" });
        return;
      }
    }

    // تأكد من وجود صورة
    if (!body.image) {
      res.status(400).json({ message: "Image URL is required" });
      return;
    }

    const product = new DeliveryProduct(body);
    await product.save();

    res.status(201).json(product);
    return;
  } catch (error: any) {
    res.status(500).json({ message: error.message });
    return;
  }
};

// Read all
export const getAll = async (req: Request, res: Response) => {
  try {
    // فلترة أساسية
    const filter: any = {};
    if (req.query.store) filter.store = req.query.store;
    if (req.query.subCategory) filter.subCategory = req.query.subCategory;

    // سياق التسعير (مدينة/قناة)
    const city =
      (req.query.city as string) ||
      (req.headers["x-city"] as string) ||
      undefined;
    const channel: "app" | "web" = (req.query.channel as any) || "app";

    // جلب المنتجات (lean أسرع)
    const products = await DeliveryProduct.find(filter)
      .populate("subCategory")
      .lean();

    // ملاحظة: التسعير لا يعتمد على placement؛ الـplacement لعرض البانرات فقط
    const promos = await fetchActivePromotions({ city, channel });

    const data = products.map((p: any) => {
      // نمرر ما يكفي للتطابق: المنتج + المتجر. (الفئة: غير متاحة هنا افتراضياً)
      const priced = applyPromotionToProduct(
        {
          _id: p._id,
          price: p.price,
          store: p.store,
          // لو لاحقاً ربطت StoreSection بـ DeliveryCategory أضفها هنا:
          // categories: p.deliveryCategory ? [p.deliveryCategory] : []
        },
        promos
      );

      return {
        ...p,
        originalPrice: priced.originalPrice,
        price: priced.finalPrice, // ← السعر بعد الخصم
        appliedPromotion: priced.appliedPromotion,
      };
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Read by ID
// Read by ID
export const getById = async (req: Request, res: Response) => {
  try {
    const city =
      (req.query.city as string) ||
      (req.headers["x-city"] as string) ||
      undefined;
    const channel: "app" | "web" = (req.query.channel as any) || "app";

    const p = await DeliveryProduct.findById(req.params.id)
      .populate("subCategory")
      .lean();

    if (!p) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    const promos = await fetchActivePromotions({ city, channel });

    const priced = applyPromotionToProduct(
      {
        _id: p._id,
        price: p.price,
        store: p.store,
        // categories: p.deliveryCategory ? [p.deliveryCategory] : []
      },
      promos
    );

    res.json({
      ...p,
      originalPrice: priced.originalPrice,
      price: priced.finalPrice,
      appliedPromotion: priced.appliedPromotion,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update
export const update = async (req: Request, res: Response) => {
  try {
    const updated = await DeliveryProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("subCategory");

    // تحقق من القسم إذا تم تعديله
    if (req.body.subCategory) {
      const section = await StoreSection.findById(req.body.subCategory);
      if (!section || section.store.toString() !== req.body.store) {
        res
          .status(400)
          .json({ message: "فئة داخلية غير صالحة أو لا تتبع المتجر" });
        return;
      }
    }

    // للـ vendor فقط: تحقق أنه يملك هذا المتجر
    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ user: req.user.id });
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

    if (!updated) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete
// Delete
export const remove = async (req: Request, res: Response) => {
  try {
    const prod = await DeliveryProduct.findById(req.params.id);
    if (!prod) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ user: req.user.id });
      if (!vendor) {
        res.status(403).json({ message: "ليس لديك حساب تاجر" });
        return;
      }
      // تحقق من ملكية المتجر عبر المنتج نفسه (وليس body)
      if (vendor.store.toString() !== prod.store.toString()) {
        res
          .status(403)
          .json({ message: "ليس لديك صلاحية حذف منتج من هذا المتجر" });
        return;
      }
    }

    await DeliveryProduct.findByIdAndDelete(prod._id);
    res.json({ message: "DeliveryProduct deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Search products with advanced filtering
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const {
      q,
      categoryId,
      subCategory,
      storeId,
      minPrice,
      maxPrice,
      isAvailable,
      page = 1,
      limit = 20,
      sort = "relevance"
    } = req.query;

    // Validate and parse parameters
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const searchQuery: any = {};

    // Text search
    if (q && (q as string).trim()) {
      searchQuery.$text = { $search: (q as string).trim() };
    }

    // Category filter
    if (categoryId) {
      searchQuery.categoryId = categoryId;
    }

    // Sub-category filter
    if (subCategory) {
      searchQuery.subCategory = subCategory;
    }

    // Store filter
    if (storeId) {
      searchQuery.store = storeId;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice as string);
    }

    // Availability filter
    if (isAvailable !== undefined) {
      searchQuery.isAvailable = isAvailable === 'true';
    }

    // Build aggregation pipeline for search with sorting
    const pipeline: any[] = [];

    // Match stage
    if (Object.keys(searchQuery).length > 0) {
      pipeline.push({ $match: searchQuery });
    }

    // Sort stage
    const sortStage: any = {};
    switch (sort) {
      case 'priceAsc':
        sortStage.price = 1;
        break;
      case 'priceDesc':
        sortStage.price = -1;
        break;
      case 'rating':
        sortStage.rating = -1;
        break;
      case 'new':
        sortStage.createdAt = -1;
        break;
      case 'relevance':
      default:
        // For text search relevance, use text score
        if (q && (q as string).trim()) {
          pipeline.push({ $addFields: { score: { $meta: "textScore" } } });
          sortStage.score = { $meta: "textScore" };
        } else {
          sortStage.createdAt = -1; // Default sort by newest
        }
        break;
    }

    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    // Populate store information
    pipeline.push({
      $lookup: {
        from: "deliverystores",
        localField: "store",
        foreignField: "_id",
        as: "storeInfo"
      }
    });

    pipeline.push({
      $unwind: {
        path: "$storeInfo",
        preserveNullAndEmptyArrays: true
      }
    });

    // Execute aggregation
    const products = await DeliveryProduct.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [...pipeline];
    // Remove skip and limit from count pipeline
    countPipeline.splice(-3); // Remove last 3 stages (skip, limit, lookup, unwind)

    const totalCount = await DeliveryProduct.aggregate([
      ...countPipeline,
      { $count: "total" }
    ]);

    const total = totalCount.length > 0 ? totalCount[0].total : 0;

    res.json({
      items: products,
      hasMore: skip + products.length < total,
      total,
      page: pageNum,
      limit: limitNum
    });

  } catch (error: any) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: "خطأ في البحث عن المنتجات" });
  }
};
