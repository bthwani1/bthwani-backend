// controllers/CategoryMacController.ts

import { Request, Response } from 'express';
import CategoryMac from '../../models/mckathi/CategoryMac';

// جلب جميع التصنيفات (مع دعم الفلترة بـ usageType)
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const usageType = req.query.usageType as string | undefined;
    const filter: Record<string, any> = {};
    if (usageType) filter.usageType = usageType;
    const categories = await CategoryMac.find(filter);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err });
  }
};

// جلب تصنيف مفرد (بـ id)
export const getCategoryMacById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await CategoryMac.findById(id);
    if (!category) {
      res.status(404).json({ message: 'غير موجود' });
      return;
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err });
  }
};

// إضافة تصنيف جديد (usageType إلزامي)
export const addCategoryMac = async (req: Request, res: Response) => {
  try {
    const { name, slug, image, parent, usageType } = req.body;
    if (!usageType) {
      res.status(400).json({ message: 'usageType مطلوب (grocery | restaurant | retail)' });
      return;
    }
    const exists = await CategoryMac.findOne({ slug });
    if (exists) {
      res.status(400).json({ message: 'Slug مستخدم بالفعل' });
      return;
    }

    const category = new CategoryMac({
      name,
      slug,
      image,
      parent: parent || null,
      usageType,
    });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err });
  }
};

// تعديل تصنيف (مع دعم تغيير usageType)
export const updateCategoryMac = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await CategoryMac.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ message: 'غير موجود' });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err });
  }
};

// حذف تصنيف
export const deleteCategoryMac = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await CategoryMac.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'غير موجود' });
      return;
    }
    res.json({ message: 'تم الحذف' });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ', error: err });
  }
};
