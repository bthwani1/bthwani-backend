// src/routes/Wallet_V8/wallet.routes.ts
import express from "express";
import {
  getWallet,
  chargeWalletViaKuraimi,
  verifyCustomer,
  reverseTransaction,
  getWalletAnalytics,
  getMonthlySpending,
} from "../../controllers/Wallet_V8/wallet.controller";
import {
  getAllWithdrawals,
  processWithdrawal,
  requestWithdrawal,
} from "../../controllers/Wallet_V8/withdrawal.controller";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { audit } from "../../middleware/audit";

const router = express.Router();

// كل هذه المسارات للمستخدم العادي، يكفي verifyFirebase فقط
router.use(verifyFirebase);

router.get("/", getWallet); // GET /api/v1/wallet
router.get("/analytics/monthly", getMonthlySpending); // GET /api/v1/wallet/analytics/monthly
router.get("/analytics", getWalletAnalytics); // GET /api/v1/wallet/analytics
router.post("/charge/kuraimi", chargeWalletViaKuraimi); // POST /api/v1/wallet/charge/kuraimi
router.post("/verify-customer", verifyCustomer); // POST /api/v1/wallet/verify-customer
router.post("/reverse/:refNo", reverseTransaction); // POST /api/v1/wallet/reverse/:refNo
router.post("/withdraw-request", requestWithdrawal); // POST /api/v1/wallet/withdraw-request

// مسارات الأدمن فقط
router.get("/admin/withdrawals", verifyAdmin, getAllWithdrawals);
router.post("/admin/withdrawals/:id/process", verifyAdmin, audit("wallet:processWithdrawal"), processWithdrawal);

export default router;
