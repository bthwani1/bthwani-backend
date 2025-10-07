// routes/admin.wallet.users.ts
import { Router } from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { listWalletUsers, getWalletByUserId, patchWalletBalance, listTransactions, walletStats } from "../../controllers/admin/wallet.users.controller";

const r = Router();
r.use(verifyFirebase, verifyAdmin);

// قائمة المستخدمين مع ملخص المحفظة
r.get("/users", listWalletUsers);

// إحصائيات عامة للمحافظ
r.get("/stats", walletStats);

// قراءة محفظة مستخدم محدد
r.get("/:userId", getWalletByUserId);

// تعديل رصيد مستخدم (توحد الـcredit/debit)
r.patch("/:userId/balance", patchWalletBalance);

// قائمة المعاملات (فلترة + ترقيم صفحات)
r.get("/transactions", listTransactions);

export default r;
