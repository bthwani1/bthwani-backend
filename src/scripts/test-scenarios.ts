// src/scripts/test-scenarios.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import Driver from "../models/Driver_app/driver";
import { WalletTransaction } from "../models/Wallet_V8/wallet.model";
import VacationRequest from "../models/Driver_app/VacationRequest";
import Order from "../models/delivery_marketplace_v1/Order";

dotenv.config();

async function createTestDriver() {
  const driver = await Driver.create({
    fullName: "السائق التجريبي",
    email: "test.driver@example.com",
    password: "hashedpassword",
    phone: "0500000000",
    role: "rider_driver",
    vehicleType: "car",
    vehicleClass: "medium",
    vehiclePower: 1500,
    isAvailable: true,
    isVerified: true,
    isBanned: false,
    location: {
      type: "Point",
      coordinates: [46.6753, 24.7136] // الرياض
    },
    residenceLocation: {
      lat: 24.7136,
      lng: 46.6753,
      address: "الرياض، السعودية",
      governorate: "الرياض",
      city: "الرياض"
    },
    wallet: {
      balance: 1000,
      earnings: 5000,
      lastUpdated: new Date()
    },
    deliveryStats: {
      deliveredCount: 50,
      canceledCount: 2,
      totalDistanceKm: 1200
    }
  });

  console.log("✅ تم إنشاء السائق التجريبي:", driver._id);
  return driver;
}

async function createTestWalletTransactions(driverId: mongoose.Types.ObjectId) {
  const transactions = [
    {
      userId: driverId,
      userModel: "Driver",
      amount: 50,
      type: "credit",
      method: "kuraimi",
      status: "completed",
      description: "توصيل طلب تجريبي 1"
    },
    {
      userId: driverId,
      userModel: "Driver",
      amount: 75,
      type: "credit",
      method: "kuraimi",
      status: "completed",
      description: "توصيل طلب تجريبي 2"
    },
    {
      userId: driverId,
      userModel: "Driver",
      amount: 100,
      type: "credit",
      method: "kuraimi",
      status: "completed",
      description: "توصيل طلب تجريبي 3"
    }
  ];

  await WalletTransaction.insertMany(transactions);
  console.log("✅ تم إنشاء معاملات المحفظة التجريبية");
}

async function createTestVacation(driverId: mongoose.Types.ObjectId) {
  const vacation = await VacationRequest.create({
    driverId,
    fromDate: new Date("2024-12-01"),
    toDate: new Date("2024-12-07"),
    reason: "إجازة عائلية"
  });

  console.log("✅ تم إنشاء طلب الإجازة التجريبي:", vacation._id);
  return vacation;
}

async function createTestOrder(driverId: mongoose.Types.ObjectId) {
  const order = await Order.create({
    customerId: new mongoose.Types.ObjectId(),
    customerName: "العميل التجريبي",
    customerPhone: "0500000001",
    pickupAddress: {
      label: "موقع الاستلام التجريبي",
      lat: 24.7136,
      lng: 46.6753
    },
    deliveryAddress: {
      label: "موقع التسليم التجريبي",
      lat: 24.7236,
      lng: 46.6853
    },
    price: 45,
    status: "pending",
    driver: driverId,
    assignedAt: new Date()
  });

  console.log("✅ تم إنشاء الطلب التجريبي:", order._id);
  return order;
}

async function runTestScenarios() {
  try {
    console.log("🚀 بدء سيناريوهات الاختبار...");

    // الاتصال بقاعدة البيانات
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/bthwani";
    await mongoose.connect(mongoUri);
    console.log("✅ تم الاتصال بقاعدة البيانات");

    // إنشاء السائق التجريبي
    const driver = await createTestDriver();

    // إنشاء معاملات المحفظة
    await createTestWalletTransactions(driver._id as mongoose.Types.ObjectId);

    // إنشاء طلب إجازة
    await createTestVacation(driver._id as mongoose.Types.ObjectId);

    // إنشاء طلب تجريبي
    await createTestOrder(driver._id as mongoose.Types.ObjectId);

    console.log("✅ تم إنجاز جميع سيناريوهات الاختبار بنجاح!");
    console.log("\n📋 البيانات التجريبية المنشأة:");
    console.log("   السائق:", driver._id);
    console.log("   معاملات المحفظة: 3 معاملات بقيم 50, 75, 100 ريال");
    console.log("   طلب إجازة: من 1 ديسمبر إلى 7 ديسمبر");
    console.log("   طلب تجريبي: قيد التنفيذ");

    console.log("\n🧪 سيناريوهات الاختبار المتاحة:");
    console.log("   1. المحفظة: اذهب إلى /driver/wallet/summary");
    console.log("   2. السحب: أرسل POST /driver/withdrawals");
    console.log("   3. الإجازات: GET /driver/vacations");
    console.log("   4. العروض: استخدم broadcastOffersForOrder()");
    console.log("   5. المركبة: فلتر السائقين حسب vehicleClass");

  } catch (error) {
    console.error("❌ خطأ في سيناريوهات الاختبار:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 تم إغلاق الاتصال بقاعدة البيانات");
  }
}

// تشغيل السيناريوهات إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runTestScenarios();
}

export { runTestScenarios };
