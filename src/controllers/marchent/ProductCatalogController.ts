// controllers/ProductCatalogController.ts

import { Request, Response } from "express";
import ProductCatalog from "../../models/mckathi/ProductCatalog";
import CategoryMac from "../../models/mckathi/CategoryMac";
type UsageType = "grocery" | "restaurant" | "retail";

// جلب كل المنتجات في الكاتالوج (مع دعم الفلترة بالـ usageType)
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const usageType = req.query.usageType as string | undefined;
    const filter: Record<string, any> = {};
    if (usageType) filter.usageType = usageType;
    const products = await ProductCatalog.find(filter)
      .populate("category")
      .populate("attributes.attribute");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "حدث خطأ", error: err });
  }
};

async function getAllChildCategoryIds(categoryId: string): Promise<string[]> {
  let ids = [categoryId];
  let children = await CategoryMac.find({ parent: categoryId });
  for (const child of children) {
    ids = ids.concat(await getAllChildCategoryIds(child._id.toString()));
  }
  return ids;
}

// في API للفلترة
export const getProductsByParentCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const categoryId = req.params.categoryId;
    const usageType = req.query.usageType as UsageType | undefined;
    const categoryIds = await getAllChildCategoryIds(categoryId);

    const filter: Record<string, any> = { category: { $in: categoryIds } };
    if (usageType) filter.usageType = usageType;

    const products = await ProductCatalog.find(filter)
      .populate("category")
      .populate("attributes.attribute");

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "حدث خطأ", error: err });
  }
};

// جلب المنتجات حسب تصنيف (مع دعم الفلترة بالـ usageType اختياري)
export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId;
    const usageType = req.query.usageType as string | undefined;
    const filter: Record<string, any> = { category: categoryId };
    if (usageType) filter.usageType = usageType;
    const products = await ProductCatalog.find(filter)
      .populate("category")
      .populate("attributes.attribute");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "حدث خطأ", error: err });
  }
};

// جلب منتج مفرد
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ProductCatalog.findById(id)
      .populate("category")
      .populate("attributes.attribute");
    if (!product) {
      res.status(404).json({ message: "غير موجود" });
      return;
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "حدث خطأ", error: err });
  }
};

// إضافة منتج جديد للكاتالوج
export const addProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, image, category, attributes, usageType } =
      req.body;
    if (!usageType) {
      res
        .status(400)
        .json({ message: "usageType مطلوب (grocery | restaurant | retail)" });
      return;
    }
    const product = new ProductCatalog({
      name,
      description,
      image,
      category,
      attributes,
      usageType, // مهم جدًا
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "حدث خطأ", error: err });
  }
};

// تعديل منتج (مع دعم تغيير usageType إن احتجت)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await ProductCatalog.findByIdAndUpdate(id, req.body, {
      new: true,
    })
      .populate("category")
      .populate("attributes.attribute");
    if (!updated) {
      res.status(404).json({ message: "غير موجود" });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "حدث خطأ", error: err });
  }
};

// حذف منتج من الكاتالوج
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await ProductCatalog.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: "غير موجود" });
      return;
    }
    res.json({ message: "تم الحذف" });
  } catch (err) {
    res.status(500).json({ message: "حدث خطأ", error: err });
  }
};
