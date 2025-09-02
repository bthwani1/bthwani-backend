// controllers/admin/vendorController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Vendor from "../../models/vendor_app/Vendor";

// POST /admin/vendors
export const addVendor = async (req: Request, res: Response) => {
  try {
    const { fullName, phone, email, password, store, isActive } = req.body;

    // تحقق من الحقول المطلوبة
    if (!fullName || !phone || !password || !store) {
       res.status(400).json({ message: "الحقول fullName, phone, password, store مطلوبة" });
       return;
    }

    // تحقق من عدم تكرار رقم الجوال
    const exists = await Vendor.findOne({ phone });
    if (exists) {
       res.status(400).json({ message: "رقم الجوال مستخدم بالفعل" });
       return;
    }

    // تجزئة كلمة المرور
    const hash = await bcrypt.hash(password, 10);

    // إنشاء التاجر
    const vendor = await Vendor.create({
      fullName,
      phone,
      email,
      password: hash,
      store,
      isActive: isActive ?? true,      // افتراضيًا true
      salesCount:   0,
      totalRevenue: 0,
    });

     res.status(201).json(vendor);
     return;
  } catch (err: any) {
    console.error("addVendor error:", err);
     res.status(500).json({ message: "حدث خطأ أثناء إنشاء التاجر" });
     return;
  }
};
