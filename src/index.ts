// src/index.ts

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
import userRoutes from "./routes/userRoutes";
import mediaRoutes from "./routes/mediaRoutes";
import driverRoutes from "./routes/driver_app/driver.routes";
import adminDriverRoutes from "./routes/admin/admin.driver.routes";
import topupRoutes from "./routes/Wallet_V8/topupRoutes";
import driverWithdrawalRoutes from "./routes/driver_app/driver.withdrawal.routes";
import vendorRoutes from "./routes/vendor_app/vendor.routes";
import storeStatsRoutes from "./routes/admin/storeStatsRoutes";
import adminNotificationTestRoutes from "./routes/admin/admin.notifications.test";
import deliveryCategoryRoutes from "./routes/delivery_marketplace_v1/DeliveryCategoryRoutes";
import deliveryStoreRoutes from "./routes/delivery_marketplace_v1/DeliveryStoreRoutes";
import deliveryProductRoutes from "./routes/delivery_marketplace_v1/DeliveryProductRoutes";
import deliverySubCategoryRoutes from "./routes/delivery_marketplace_v1/DeliveryProductSubCategoryRoutes";
import deliveryBannerRoutes from "./routes/delivery_marketplace_v1/DeliveryBannerRoutes";
import DeliveryOfferRoutes from "./routes/delivery_marketplace_v1/DeliveryOfferRoutes";
import deliveryCartRouter from "./routes/delivery_marketplace_v1/DeliveryCartRoutes";
import deliveryOrderRoutes from "./routes/delivery_marketplace_v1/DeliveryOrderRoutes";
import StatestoreRoutes from "./routes/admin/storeStatsRoutes";
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
import adminReports from "./routes/admin/reportsRoutes";
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
import walletOrderRoutes from "./routes/Wallet_V8/walletOrderRoutes";
import supportRoutes from "./routes/support.routes";
import appRoutes from "./routes/app.routes";
import walletRoutes from "./routes/Wallet_V8/wallet.routes";
import metaRoutes from "./routes/meta";

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

// Socket.IO middleware/setup (يظل كما هو)
io.use(verifyTokenSocket);
io.on("connection", (socket) => {
  const uid = socket.data.uid;
  if (uid) socket.join(`user_${uid}`);
  socket.on("disconnect", () => {
    if (uid) socket.leave(`user_${uid}`);
  });
});
// إذا لديك مزيد من listeners، اتركها كما هي (كودك الأصلي)

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
    console.log(">>> Authorization header:", req.headers.authorization);
  }
  next();
});

app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/auth/password`, passwordResetRouter);
app.use(`${API_PREFIX}/delivery/promotions`, deliveryPromotionRoutes);
app.use(`${API_PREFIX}/delivery/categories`, deliveryCategoryRoutes);
app.use(`${API_PREFIX}/delivery/order`, deliveryOrderRoutes);

app.use(`${API_PREFIX}/delivery/stores`, deliveryStoreRoutes);
app.use(`${API_PREFIX}/delivery/products`, deliveryProductRoutes);
app.use(`${API_PREFIX}/delivery/offer`, DeliveryOfferRoutes);
app.use(`${API_PREFIX}/delivery/cart`, deliveryCartRouter);
app.use(`${API_PREFIX}/groceries`, groceriesRoutes);
app.use(`${API_PREFIX}/meta`, metaRoutes);
app.use(`${API_PREFIX}/utility`, utilityRoutes);
app.use(`${API_PREFIX}/delivery/subcategories`, deliverySubCategoryRoutes);
app.use(`${API_PREFIX}/delivery/banners`, deliveryBannerRoutes);
app.use(`${API_PREFIX}/delivery/sections`, storeSectionRoutes);
app.use(`${API_PREFIX}/favorites`, favoritesRoutes);

app.use(`${API_PREFIX}/wallet`, walletRoutes);
app.use(`${API_PREFIX}/wallet/order`, walletOrderRoutes);
app.use(`${API_PREFIX}`, pushRouter);

app.use(`${API_PREFIX}/topup`, topupRoutes);
app.use(`${API_PREFIX}/support`, supportRoutes);
app.use(`${API_PREFIX}/app`, appRoutes);

app.use(`${API_PREFIX}/admin`, adminRoutes);

app.use(`${API_PREFIX}/admin/drivers`, adminDriverRoutes);
app.use(`${API_PREFIX}/`, adminVendorModeration);

app.use(`${API_PREFIX}/auth/`, marketingAuthRoutes);
app.use(`${API_PREFIX}/`, onboardingRoutes);
app.use(`${API_PREFIX}/`, adminReports);
app.use(`${API_PREFIX}/files`, mediaMarketerRoutes);
app.use(`${API_PREFIX}/field`, quickOnboardRoutes);
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
app.use(`${API_PREFIX}/driver`, driverRoutes);
app.use(`${API_PREFIX}/admin/withdrawals`, adminWithdrawalRoutes);
app.use(`${API_PREFIX}/admin/storestats`, storeStatsRoutes);
app.use(`${API_PREFIX}/admin/notifications`, adminNotificationRoutes);

app.use(`${API_PREFIX}/`, adminNotificationTestRoutes);
app.use(`${API_PREFIX}/`, marketerStoreVendorRoutes);
app.use(`${API_PREFIX}/`, marketerOverviewRoutes);
app.use(`${API_PREFIX}/`, adminOnboarding);
app.use(`${API_PREFIX}/`, adminCommission);
app.use(`${API_PREFIX}`, StatestoreRoutes);

app.use(`${API_PREFIX}/admin/marketers`, adminMarketers);
app.use(`${API_PREFIX}/`, adminStoreModeration);
app.use(`${API_PREFIX}/`, activationRoutes);
app.use(`${API_PREFIX}/deliveryapp/withdrawals`, driverWithdrawalRoutes);
app.use(`${API_PREFIX}/utility`, utilityRoutes);
app.use(`${API_PREFIX}/`, rediasRoutes);
app.use(`${API_PREFIX}/vendor`, vendorRoutes);
app.use(`${API_PREFIX}/pricing-strategies`, pricingStrategyRoutes);
app.use(`${API_PREFIX}/`, marketingRouter);

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
