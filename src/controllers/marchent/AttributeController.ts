// controllers/AttributeController.ts

import { Request, Response } from "express";
import Attribute from "../../models/mckathi/Attribute";
import { Types } from "mongoose";
import CategoryMac from "../../models/mckathi/CategoryMac";

// جلب كل السمات (يدعم الفلترة بـ usageType)
export const getAllAttributes = async (req: Request, res: Response) => {
  try {
    const usageType = req.query.usageType as string | undefined;
    const filter: Record<string, any> = {};
    if (usageType) filter.usageType = usageType;
    const attributes = await Attribute.find(filter).populate("categories");
    res.json(attributes);
  } catch (err) {
    console.error("حدث خطأ عند جلب السمات:", err);

    res.status(500).json({ message: "حدث خطأ", error: err });
  }
};

// جلب السمات حسب التصنيف (ويدعم usageType اختياري)
async function getAllCategoryParents(categoryId: string) {
  let parents: string[] = [];
  let current = await CategoryMac.findById(categoryId);
  while (current && current.parent) {
    parents.push(current.parent.toString());
    current = await CategoryMac.findById(current.parent);
  }
  return parents;
}

export const getAttributesByCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId;
    const usageType = req.query.usageType as string | undefined;

    if (!Types.ObjectId.isValid(categoryId)) {
      res.status(400).json({ message: "categoryId غير صحيح" });
      return;
    }

    // احصل على كل IDs: التصنيف الحالي + كل آبائه
    const parentIds = await getAllCategoryParents(categoryId);
    const categoryIds = [categoryId, ...parentIds];

    const filter: Record<string, any> = {
      categories: { $in: categoryIds },
    };
    if (usageType) filter.usageType = usageType;

    const attributes = await Attribute.find(filter).populate("categories");
    res.json(attributes);
  } catch (err) {
    console.error("حدث خطأ عند جلب السمات:", err);
    res.status(500).json({ message: "حدث خطأ", error: err });
  }
};

// إضافة سمة (usageType إلزامي)
export const addAttribute = async (req: Request, res: Response) => {
  try {
    const { name, slug, categories, unit, type, options, usageType } = req.body;
    if (!usageType) {
      res
        .status(400)
        .json({ message: "usageType مطلوب (grocery | restaurant | retail)" });
      return;
    }
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      res.status(400).json({ message: "categories مطلوبة (مصفوفة من IDs)" });
      return;
    }
    const attribute = new Attribute({
      name,
      slug,
      categories,
      unit,
      type,
      options,
      usageType,
    });
    await attribute.save();
    res.status(201).json(attribute);
  } catch (err) {
    res.status(500).json({ message: "حدث خطأ", error: err });
  }
};

// تعديل سمة (مع دعم تغيير usageType)
export const updateAttribute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await Attribute.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updated) {
      res.status(404).json({ message: "غير موجود" });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "حدث خطأ", error: err });
  }
};

// حذف سمة
export const deleteAttribute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Attribute.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: "غير موجود" });
      return;
    }
    res.json({ message: "تم الحذف" });
  } catch (err) {
    res.status(500).json({ message: "حدث خطأ", error: err });
  }
};
