// src/index.ts
import { registerSupportSocket } from "./sockets/supportHandlers";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server as IOServer } from "socket.io";
// استيراد Middleware
import { verifyTokenSocket } from "./middleware/verifyTokenSocket";

// استيراد Routes (كما عندك)
import adminRoutes from "./routes/admin/adminRoutes";
import adminWithdrawalRoutes from "./routes/admin/admin.withdrawal.routes";
import dataDeletionRoutes from "./routes/admin/dataDeletionRoutes";
import backupRoutes from "./routes/admin/backupRoutes";
import userRoutes from "./routes/userRoutes";
import mediaRoutes from "./routes/mediaRoutes";
import driverRoutes from "./routes/driver_app/driver.routes";
import adminDriverRoutes from "./routes/admin/admin.driver.routes";
import topupRoutes from "./routes/Wallet_V8/topupRoutes";
import driverWithdrawalRoutes from "./routes/driver_app/driver.withdrawal.routes";
import driverVacationRoutes from "./routes/driver_app/driver.vacation.routes";
import vendorRoutes from "./routes/vendor_app/vendor.routes";
import settlementRoutes from "./routes/vendor_app/settlement.routes";
import storeStatsRoutes from "./routes/admin/storeStatsRoutes";
import deliveryCategoryRoutes from "./routes/delivery_marketplace_v1/DeliveryCategoryRoutes";
import deliveryStoreRoutes from "./routes/delivery_marketplace_v1/DeliveryStoreRoutes";
import deliveryProductRoutes from "./routes/delivery_marketplace_v1/DeliveryProductRoutes";
import deliverySubCategoryRoutes from "./routes/delivery_marketplace_v1/DeliveryProductSubCategoryRoutes";
import deliveryBannerRoutes from "./routes/delivery_marketplace_v1/DeliveryBannerRoutes";
import DeliveryOfferRoutes from "./routes/delivery_marketplace_v1/DeliveryOfferRoutes";
import deliveryCartRouter from "./routes/delivery_marketplace_v1/DeliveryCartRoutes";
import deliveryOrderRoutes from "./routes/delivery_marketplace_v1/DeliveryOrderRoutes";
import employeeRoutes from "./routes/er/employee.routes";
import attendanceRoutes from "./routes/er/attendance.routes";
import leaveRequestRoutes from "./routes/er/leaveRequest.routes";
import performanceGoalRoutes from "./routes/er/performanceGoal.routes";
import pricingStrategyRoutes from "./routes/delivery_marketplace_v1/pricingStrategy";
import deliveryPromotionRoutes from "./routes/delivery_marketplace_v1/promotion.routes";
import groceriesRoutes from "./routes/marchent/api";
import storeSectionRoutes from "./routes/delivery_marketplace_v1/storeSection.routes";
import chartAccountRoutes from "./routes/er/chartAccount.routes";
import journalEntryRouter from "./routes/er/journalEntry.routes";
import journalBookRouter from "./routes/er/journals.routes";
import marketingRouter from "./routes/marketing";
import pushRouter from "./push";
import { initIndexesAndValidate } from "./bootstrap/indexes";
import { registerRoasCron } from "./cron/roas";
import { registerAdSpendCron } from "./cron/adspend";
import { registerAccountCleanupCron } from "./cron/account-cleanup";
import { registerBackupCron } from "./cron/backup";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import passwordResetRouter from "./routes/passwordReset";
import favoritesRoutes from "./routes/favorites";
import marketerStoreVendorRoutes from "./routes/marketerV1/marketerStoreVendorRoutes";
import marketerOverviewRoutes from "./routes/marketerV1/marketerOverviewRoutes";
import adminVendorModeration from "./routes/admin/vendorModerationRoutes";
import adminOnboarding from "./routes/admin/onboardingRoutes";
import adminCommission from "./routes/admin/commissionPlansRoutes";
import marketerReports from "./routes/admin/reportsRoutes";
import utilityRoutes from "./routes/delivery_marketplace_v1/utility";
import adminMarketers from "./routes/admin/marketersRoutes";
import adminStoreModeration from "./routes/admin/storeModerationRoutes";
import adminNotificationRoutes from "./routes/admin/admin.notifications.routes";
import rediasRoutes from "./routes/redias";
import activationRoutes from "./routes/admin/activation.routes";
import quickOnboardRoutes from "./routes/field/quickOnboard.routes";
import marketingAuthRoutes from "./routes/marketerV1/auth.routes";
import onboardingRoutes from "./routes/field/onboarding.routes";
import mediaMarketerRoutes from "./routes/marketerV1/mediaMarketerRoutes";
import referralRoutes from "./routes/field/referral.routes";
import walletOrderRoutes from "./routes/Wallet_V8/walletOrderRoutes";
import appRoutes from "./routes/app.routes";
import walletRoutes from "./routes/Wallet_V8/wallet.routes";
import metaRoutes from "./routes/meta";
import adminCmsRoutes from "./routes/admin/admin.cms.routes";
import cmsRoutes from "./routes/cms.routes";
import dashboardOverviewRoutes from "./routes/admin/dashboardOverview.routes";
import testOtpRoutes from "./routes/testOtp";
import authRoutes from "./routes/auth.routes";

// Missing route imports
import adminWalletCouponsRoutes from "./routes/admin/admin.wallet.coupons";
import adminUsersRoutes from "./routes/admin/adminUsersRoutes";
import driversAssetsRoutes from "./routes/admin/drivers.assets";
import driversAttendanceRoutes from "./routes/admin/drivers.attendance";
import driversDocsRoutes from "./routes/admin/drivers.docs";
import driversFinanceRoutes from "./routes/admin/drivers.finance";
import driversShiftsRoutes from "./routes/admin/drivers.shifts";
import adminNotificationRoutes2 from "./routes/admin/notification.routes";
import adminDriverVacationsRoutes from "./routes/admin/admin.driver.vacations.routes";
import driversLeaveRoutes from "./routes/admin/drivers.leave.routes";
import settingsRoutes from "./routes/admin/settings.routes";
import qualityRoutes from "./routes/admin/quality.routes";
import supportRoutes from "./routes/admin/support.routes";

// ER routes
import accountPayableRoutes from "./routes/er/accountPayable.routes";
import accountReceivableRoutes from "./routes/er/accountReceivable.routes";
import assetRoutes from "./routes/er/asset.routes";
import budgetRoutes from "./routes/er/budget.routes";
import dashboardRoutes from "./routes/er/dashboard.routes";
import documentRoutes from "./routes/er/document.routes";
import kpiAssignmentRoutes from "./routes/er/kpiAssignment.routes";
import ledgerEntryRoutes from "./routes/er/ledgerEntry.routes";
import payrollRoutes from "./routes/er/payroll.routes";
import performanceReviewRoutes from "./routes/er/performanceReview.routes";
import taskRoutes from "./routes/er/task.routes";

// Other missing routes
import sheinCartRoutes from "./routes/delivery_marketplace_v1/sheinCart";
import driverAttendanceRoutes from "./routes/driver_app/attendance";
import kpisRoutes from "./routes/kpis";
import marketingRoasRoutes from "./routes/marketing-roas";
import messagesRoutes from "./routes/messages";
import partnersRoutes from "./routes/partners";
import roasRoutes from "./routes/roas";
import segmentsRoutes from "./routes/segments";
import supportCustomersRoutes from "./routes/support/customers";
import supportMessagingPrefsRoutes from "./routes/support/messaging-prefs";
import supportRoutes2 from "./routes/support";
import userAvatarRoutes from "./routes/userAvatarRoutes";
import couponRoutes from "./routes/Wallet_V8/coupon.routes";
import subscriptionRoutes from "./routes/Wallet_V8/subscription.routes";
import adminManagementRoutes from "./routes/admin/adminManagementRoutes";
import DeliveryStoreRoutes from "./routes/delivery_marketplace_v1/DeliveryStoreRoutes";

dotenv.config();
console.log("[BOOT] pid:", process.pid, "build:", new Date().toISOString());

const app = express();
const server = http.createServer(app);
export const io = new IOServer(server, {
  cors: {
    origin: "*",
  },
});
dayjs.extend(utc);
dayjs.extend(tz);
dayjs.tz.setDefault("Asia/Aden");
process.env.TZ = "Asia/Aden";
// Socket.IO middleware/setup
io.use(verifyTokenSocket);
io.on("connection", (socket) => {
  const uid = socket.data.uid;

  // الانضمام الافتراضي لغرفة المستخدم
  if (uid) {
    socket.join(`user_${uid}`);
  }

  // الانضمام لغرفة الإدارة (للمشرفين فقط)
  socket.on("admin:subscribe", () => {
    if (socket.data.role === "admin" || socket.data.role === "super_admin") {
      socket.join("orders_admin");
    }
  });

  // الانضمام لغرفة طلب محدد
  socket.on("join:order", (data: { orderId: string }) => {
    socket.join(`order_${data.orderId}`);
  });

  // مغادرة غرفة طلب محدد
  socket.on("leave:order", (data: { orderId: string }) => {
    socket.leave(`order_${data.orderId}`);
  });

  // الانضمام لغرفة سائق محدد (للتطبيقات المحمولة)
  socket.on("join:driver", (data: { driverId: string }) => {
    socket.join(`driver_${data.driverId}`);
  });

  // الانضمام لغرفة تاجر محدد (للتطبيقات المحمولة)
  socket.on("join:vendor", (data: { vendorId: string }) => {
    socket.join(`vendor_${data.vendorId}`);
  });

  socket.on("disconnect", () => {
    if (uid) socket.leave(`user_${uid}`);
  });
});
// إذا لديك مزيد من registerSupportSocket(io);
registerSupportSocket(io);

// استيراد وتفعيل Fallback Polling
import { pollingService } from "./services/pollingService";
pollingService.startPolling();
// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use((req, _res, next) => {
  console.log(`↔️ Incoming request: ${req.method} ${req.url}`);
  next();
});
app.use(express.json());

const API_PREFIX = "/api/v1";
app.use((req, res, next) => {
  if (req.path.startsWith("/api/v1") && req.method === "POST") {
    console.log(">>> INCOMING REQ:", req.method, req.originalUrl);
    // Only log authorization header in development
    if (process.env.NODE_ENV !== "production") {
      console.log(">>> Authorization header:", req.headers.authorization);
    }
  }
  next();
});

app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/auth/password`, passwordResetRouter);
app.use(`${API_PREFIX}/delivery/promotions`, deliveryPromotionRoutes);
app.use(`${API_PREFIX}/delivery/categories`, deliveryCategoryRoutes);
app.use(`${API_PREFIX}/delivery/order`, deliveryOrderRoutes);

app.use(`${API_PREFIX}/auth`, marketingAuthRoutes);
app.use(`${API_PREFIX}/auth/jwt`, authRoutes); // JWT refresh/logout endpoints
app.use(`${API_PREFIX}/reports/marketers`, marketerReports);
app.use(`${API_PREFIX}/field/onboarding`, onboardingRoutes);
app.use(`${API_PREFIX}/files`, mediaMarketerRoutes);
app.use(`${API_PREFIX}/field`, quickOnboardRoutes);
app.use(`${API_PREFIX}/referrals`, referralRoutes);
app.use(`${API_PREFIX}/admin/dashboard`, dashboardOverviewRoutes);
app.use(`${API_PREFIX}/driver`, driverRoutes);
app.use(`${API_PREFIX}/admin/users`, adminManagementRoutes);
app.use(`${API_PREFIX}/admin/data-deletion`, dataDeletionRoutes);
app.use(`${API_PREFIX}/admin/backups`, backupRoutes);


app.use(`${API_PREFIX}/vendor`, vendorRoutes);
app.use(`${API_PREFIX}/vendor/settlements`, settlementRoutes);
app.use(`${API_PREFIX}/delivery/stores`, deliveryStoreRoutes);
app.use(`${API_PREFIX}/delivery/products`, deliveryProductRoutes);
app.use(`${API_PREFIX}/delivery/offer`, DeliveryOfferRoutes);
app.use(`${API_PREFIX}/delivery/cart`, deliveryCartRouter);
app.use(`${API_PREFIX}/groceries`, groceriesRoutes);

app.use(`${API_PREFIX}/meta`, metaRoutes);
app.use(`${API_PREFIX}/utility`, utilityRoutes);
app.use(`${API_PREFIX}/cms`, cmsRoutes);

app.use(`${API_PREFIX}/delivery/subcategories`, deliverySubCategoryRoutes);
app.use(`${API_PREFIX}/delivery/banners`, deliveryBannerRoutes);
app.use(`${API_PREFIX}/delivery/sections`, storeSectionRoutes);
app.use(`${API_PREFIX}/favorites`, favoritesRoutes);
app.use(`${API_PREFIX}/admin/onboarding-slides`, adminCmsRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);
app.use(`${API_PREFIX}/wallet/order`, walletOrderRoutes);


app.use(`${API_PREFIX}/`, pushRouter);

app.use(`${API_PREFIX}/topup`, topupRoutes);
app.use(`${API_PREFIX}/support`, supportRoutes);
app.use(`${API_PREFIX}/app`, appRoutes);

app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/admin/marketers`, adminMarketers);

app.use(`${API_PREFIX}/admin/drivers`, adminDriverRoutes);
app.use(`${API_PREFIX}/admin/vendors`, adminVendorModeration);




// Routes (كما في كودك)
app.use(`${API_PREFIX}/media`, mediaRoutes);
app.use(`${API_PREFIX}/employees`, employeeRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/leaves`, leaveRequestRoutes);
app.use(`${API_PREFIX}/goals`, performanceGoalRoutes);
app.use(`${API_PREFIX}/accounts/chart`, chartAccountRoutes);
app.use(`${API_PREFIX}/admin/notifications`, adminNotificationRoutes);
app.use(`${API_PREFIX}/entries`, journalEntryRouter);
app.use(`${API_PREFIX}/accounts`, chartAccountRoutes);
app.use(`${API_PREFIX}/journals`, journalBookRouter);
app.use(`${API_PREFIX}/admin/withdrawals`, adminWithdrawalRoutes);
app.use(`${API_PREFIX}/admin/storestats`, storeStatsRoutes);


app.use(`${API_PREFIX}/marketer`, marketerStoreVendorRoutes);
app.use(`${API_PREFIX}/marketer/overview`, marketerOverviewRoutes);
app.use(`${API_PREFIX}/admin/field/onboarding`, adminOnboarding);
app.use(`${API_PREFIX}/admin/commission-plans`, adminCommission);
app.use(`${API_PREFIX}/delivery/stores`, DeliveryStoreRoutes);

app.use(`${API_PREFIX}/admin/marketer-stores`, adminStoreModeration);
app.use(`${API_PREFIX}/admin/activation`, activationRoutes);
app.use(`${API_PREFIX}/driver/withdrawals`, driverWithdrawalRoutes);
app.use(`${API_PREFIX}/driver/vacations`, driverVacationRoutes);
app.use(`${API_PREFIX}/admin/debug/redis`, rediasRoutes);
app.use(`${API_PREFIX}/pricing-strategies`, pricingStrategyRoutes);
app.use(`${API_PREFIX}/marketing`, marketingRouter);

// Missing route registrations
// Admin routes
app.use(`${API_PREFIX}/admin/wallet`, adminWalletCouponsRoutes);
app.use(`${API_PREFIX}/admin/users`, adminUsersRoutes);
app.use(`${API_PREFIX}/admin/drivers/assets`, driversAssetsRoutes);
app.use(`${API_PREFIX}/admin/drivers/attendance`, driversAttendanceRoutes);
app.use(`${API_PREFIX}/admin/drivers/docs`, driversDocsRoutes);
app.use(`${API_PREFIX}/admin/drivers/finance`, driversFinanceRoutes);
app.use(`${API_PREFIX}/admin/drivers/shifts`, driversShiftsRoutes);
app.use(`${API_PREFIX}/admin/drivers/vacations`, adminDriverVacationsRoutes);
app.use(`${API_PREFIX}/admin/drivers/leave-requests`, driversLeaveRoutes);
app.use(`${API_PREFIX}/admin/settings`, settingsRoutes);
app.use(`${API_PREFIX}/admin/quality`, qualityRoutes);
app.use(`${API_PREFIX}/admin/support`, supportRoutes);
app.use(`${API_PREFIX}/admin/notifications/v2`, adminNotificationRoutes2);

// ER routes
app.use(`${API_PREFIX}/er/accounts-payable`, accountPayableRoutes);
app.use(`${API_PREFIX}/er/accounts-receivable`, accountReceivableRoutes);
app.use(`${API_PREFIX}/er/assets`, assetRoutes);
app.use(`${API_PREFIX}/er/budgets`, budgetRoutes);
app.use(`${API_PREFIX}/er/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/er/documents`, documentRoutes);
app.use(`${API_PREFIX}/er/kpi-assignments`, kpiAssignmentRoutes);
app.use(`${API_PREFIX}/er/ledger-entries`, ledgerEntryRoutes);
app.use(`${API_PREFIX}/er/payroll`, payrollRoutes);
app.use(`${API_PREFIX}/er/performance-reviews`, performanceReviewRoutes);
app.use(`${API_PREFIX}/er/tasks`, taskRoutes);

// Other routes
app.use(`${API_PREFIX}/delivery/shein-cart`, sheinCartRoutes);
app.use(`${API_PREFIX}/driver/attendance`, driverAttendanceRoutes);
app.use(`${API_PREFIX}/kpis`, kpisRoutes);
app.use(`${API_PREFIX}/marketing/roas`, marketingRoasRoutes);
app.use(`${API_PREFIX}/messages`, messagesRoutes);
app.use(`${API_PREFIX}/partners`, partnersRoutes);
app.use(`${API_PREFIX}/roas`, roasRoutes);
app.use(`${API_PREFIX}/segments`, segmentsRoutes);
app.use(`${API_PREFIX}/support/customers`, supportCustomersRoutes);
app.use(`${API_PREFIX}/support/messaging-prefs`, supportMessagingPrefsRoutes);
app.use(`${API_PREFIX}/support/v2`, supportRoutes2);
app.use(`${API_PREFIX}/users/avatar`, userAvatarRoutes);
app.use(`${API_PREFIX}/wallet/coupons`, couponRoutes);
app.use(`${API_PREFIX}/wallet/subscriptions`, subscriptionRoutes);

// Test OTP endpoints (للاختبار فقط)
app.use(`${API_PREFIX}/test/otp`, testOtpRoutes);

// Swagger documentation
import { swaggerUi, specs } from "./bootstrap/swagger";
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Global error handler (must be last)
import { errorHandler } from "./middleware/errorHandler";
app.use(errorHandler);

app.get("/", (_, res) => {
  res.send("bThwani backend is running ✅");
});

// إعدادات السيرفر وقاعدة البيانات
const PORT = parseInt(process.env.PORT || "3000", 10);
const MONGO_URI = process.env.MONGO_URI || "";

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not set. Please set MONGO_URI in your .env");
  process.exit(1);
}

async function connectWithRetry(uri: string, maxAttempts = 10) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      attempt++;
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
      });
      console.log("✅ Connected to MongoDB", {
        db: mongoose.connection.db?.databaseName || "<unknown>",
      });
      return;
    } catch (err: any) {
      console.error(
        `Mongo connect attempt ${attempt} failed: ${err.message || err}`
      );
      const backoff = Math.min(3000 * attempt, 30000);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw new Error("✖ Could not connect to MongoDB after retries");
}

const startServer = async () => {
  try {
    // 1) Connect to Mongo
    await connectWithRetry(MONGO_URI);

    // 2) disable autoIndex in production
    if (process.env.NODE_ENV === "production") {
      mongoose.set("autoIndex", false);
    }

    // 3) Now call initIndexesAndValidate() — only after connection
    try {
      await initIndexesAndValidate();
      console.log("📌 initIndexesAndValidate completed");
    } catch (err) {
      console.warn("⚠️ initIndexesAndValidate failed (continuing):", err);
    }

    // 4) register crons / queues here (after DB + Redis ready)
    try {
      registerAdSpendCron();
      registerRoasCron();
      registerAccountCleanupCron();
      registerBackupCron();
      // if you have initCampaignQueue(redisConn) call it here
    } catch (err) {
      console.warn("⚠️ Failed to init cron/queues (continuing):", err);
    }

    // 5) start server
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
};

startServer();
