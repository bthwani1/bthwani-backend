// src/scripts/migrate-drivers.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import Driver from "../models/Driver_app/driver";

dotenv.config();

async function migrateDrivers() {
  try {
    console.log("🚀 بدء ترقية بيانات السائقين...");

    // الاتصال بقاعدة البيانات
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/bthwani";
    await mongoose.connect(mongoUri);
    console.log("✅ تم الاتصال بقاعدة البيانات");

    // إضافة الحقول الجديدة للسائقين الموجودين
    const result = await Driver.updateMany(
      { vehicleClass: { $exists: false } },
      {
        $set: {
          vehicleClass: "light",
          vehiclePower: 0
        }
      }
    );

    console.log(`✅ تم تحديث ${result.modifiedCount} سائق بنجاح`);

    // إضافة الفهارس إذا لم تكن موجودة
    try {
      await Driver.collection.createIndex({ vehicleClass: 1 });
      await Driver.collection.createIndex({ vehiclePower: 1 });
      console.log("✅ تم إنشاء الفهارس بنجاح");
    } catch (error: any) {
      if (error.code !== 11000) { // تجاهل خطأ "الفهرس موجود بالفعل"
        console.warn("⚠️ تحذير في إنشاء الفهارس:", error.message);
      } else {
        console.log("✅ الفهارس موجودة بالفعل");
      }
    }

    console.log("🎉 تم إنجاز ترقية البيانات بنجاح!");

  } catch (error) {
    console.error("❌ خطأ في ترقية البيانات:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 تم إغلاق الاتصال بقاعدة البيانات");
  }
}

// تشغيل الترقية إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  migrateDrivers();
}

export { migrateDrivers };
